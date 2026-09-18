import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
import path from "node:path";
import type { Server as NodeHttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { TimerEngine } from "../timer/TimerEngine";
import { createDefaultProfile } from "../profiles/defaults";
import type {
  AdminCommand,
  ClientRole,
  ServerStatePayload,
  TimerProfile,
  TimerState,
  TimerCommandPayload,
} from "../types";
import { EVENTS } from "../types";

export interface ServerPersistShape {
  profiles: TimerProfile[];
  activeProfileId: string | null;
  timerState: TimerState;
  version: number;
}

interface SocketClientInfo {
  role: ClientRole;
  displayId: string;
}

const SAVE_VERSION = 1;

export class TCGServer {
  private engine: TimerEngine = new TimerEngine();
  private profiles: TimerProfile[] = [];
  private activeProfileId: string | null = null;
  private io: SocketIOServer;
  private clients = new Map<string, SocketClientInfo>();
  private persistFile: string;
  private uploadsDir: string;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(httpServer: NodeHttpServer, opts?: { dataFile?: string; uploadsDir?: string }) {
    this.persistFile = opts?.dataFile ?? path.join(process.cwd(), "data", "server-state.json");
    this.uploadsDir = opts?.uploadsDir ?? path.join(process.cwd(), "public", "uploads");

    this.load();

    this.io = new SocketIOServer(httpServer, {
      path: "/socket.io",
      cors: { origin: true, methods: ["GET", "POST"] },
    });

    this.wireEvents();
  }

  private wireEvents(): void {
    this.io.on("connection", (socket) => {
      const q = socket.handshake.query;
      const role: ClientRole = q.role === "display" ? "display" : "admin";
      const displayId = typeof q.displayId === "string" && q.displayId ? q.displayId : "main";
      this.clients.set(socket.id, { role, displayId });

      socket.emit(EVENTS.state, this.buildPayload());

      socket.on(EVENTS.adminCommand, (command: AdminCommand) => {
        try {
          this.handleCommand(command);
        } catch (err) {
          socket.emit(EVENTS.error, {
            message: err instanceof Error ? err.message : "Comando inválido",
          });
        }
      });

      socket.on("disconnect", () => {
        this.clients.delete(socket.id);
        this.broadcastClientsInfo();
      });

      this.broadcastClientsInfo();
    });
  }

  private handleCommand(command: AdminCommand): void {
    switch (command.type) {
      case "timer":
        this.handleTimerCommand(command.payload);
        break;
      case "profile:apply": {
        if (!this.profiles.some((p) => p.id === command.profileId)) break;
        this.activeProfileId = command.profileId;
        this.schedulePersist();
        break;
      }
      case "profile:save": {
        const profile = sanitizeProfile(command.profile);
        const idx = this.profiles.findIndex((p) => p.id === profile.id);
        if (idx >= 0) this.profiles[idx] = profile;
        else this.profiles.push(profile);
        this.activeProfileId = profile.id;
        this.schedulePersist();
        break;
      }
      case "profile:delete": {
        if (this.profiles.length <= 1) {
          throw new Error("No se puede eliminar el último perfil");
        }
        const idx = this.profiles.findIndex((p) => p.id === command.profileId);
        if (idx < 0) return;
        this.profiles.splice(idx, 1);
        if (this.activeProfileId === command.profileId) {
          this.activeProfileId = this.profiles[0]?.id ?? null;
        }
        this.schedulePersist();
        break;
      }
    }
    this.broadcast();
  }

  private handleTimerCommand(payload: TimerCommandPayload): void {
    const activeProfile = this.activeProfile();

    if (payload.cmd === "start" || payload.cmd === "reset") {
      const profile = payload.profile ? sanitizeProfile(payload.profile) : activeProfile;
      if (!profile) throw new Error("No hay perfil activo");
      const idx = this.profiles.findIndex((p) => p.id === profile.id);
      if (payload.profile) {
        if (idx >= 0) this.profiles[idx] = profile;
        else this.profiles.push(profile);
        this.activeProfileId = profile.id;
      }
      if (payload.cmd === "start") {
        this.engine.configure(profile.durationMinutes);
        this.engine.apply({ cmd: "start" });
      } else {
        this.engine.configure(profile.durationMinutes);
      }
    } else if (payload.cmd === "pause") {
      this.engine.apply({ cmd: "pause" });
    } else if (payload.cmd === "resume") {
      this.engine.apply({ cmd: "resume" });
    } else if (payload.cmd === "addMinutes") {
      this.engine.apply({ cmd: "addMinutes", minutes: payload.minutes });
    }

    this.schedulePersist();
  }

  private activeProfile(): TimerProfile | null {
    if (!this.activeProfileId) return this.profiles[0] ?? null;
    return this.profiles.find((p) => p.id === this.activeProfileId) ?? this.profiles[0] ?? null;
  }

  private buildPayload(): ServerStatePayload {
    const now = Date.now();
    return {
      timer: this.engine.getSnapshot(now),
      activeProfileId: this.activeProfileId,
      profiles: this.profiles,
      serverTime: now,
    };
  }

  private broadcast(): void {
    this.io.emit(EVENTS.state, this.buildPayload());
  }

  private broadcastClientsInfo(): void {
    let admins = 0;
    let displays = 0;
    for (const info of this.clients.values()) {
      if (info.role === "admin") admins++;
      else displays++;
    }
    this.io.emit(EVENTS.clientsInfo, { admins, displays });
  }

  // ---- persistence -------------------------------------------------------

  private load(): void {
    let data: ServerPersistShape | null = null;
    try {
      if (existsSync(this.persistFile)) {
        const raw = readFileSync(this.persistFile, "utf8");
        data = JSON.parse(raw) as ServerPersistShape;
      }
    } catch (err) {
      console.error("No se pudo leer la persistencia, se inicia desde cero:", err);
    }

    if (data && Array.isArray(data.profiles) && data.profiles.length > 0) {
      this.profiles = data.profiles.map(sanitizeProfile);
      const firstId = this.profiles[0].id;
      const fallbackState: TimerState = {
        status: "NOT_STARTED",
        durationMs: (this.activeProfile()?.durationMinutes ?? 50) * 60_000,
        startedAt: null,
        endTime: null,
        accumulatedMs: 0,
        finishedAt: null,
        updatedAt: 0,
      };
      this.activeProfileId =
        data.activeProfileId &&
        this.profiles.some((p) => p.id === data.activeProfileId)
          ? data.activeProfileId
          : firstId;
      this.engine = new TimerEngine(data.timerState ?? fallbackState);
    } else {
      const first = createDefaultProfile({ name: "Pokémon 50 min", durationMinutes: 50 });
      this.profiles = [first];
      this.activeProfileId = first.id;
      this.engine = new TimerEngine();
      this.engine.configure(first.durationMinutes);
    }
  }

  private schedulePersist(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.persist();
    }, 400);
  }

  private persist(): void {
    try {
      mkdirSync(path.dirname(this.persistFile), { recursive: true });
      const tmp = `${this.persistFile}.tmp`;
      const shape: ServerPersistShape = {
        version: SAVE_VERSION,
        profiles: this.profiles,
        activeProfileId: this.activeProfileId,
        timerState: this.engine.getState(),
      };
      writeFileSync(tmp, JSON.stringify(shape, null, 2), "utf8");
      renameSync(tmp, this.persistFile);
    } catch (err) {
      console.error("Falló la persistencia:", err);
    }
  }

  /** Register an uploaded image and return its public URL. */
  public get uploads(): { dir: string } {
    return { dir: this.uploadsDir };
  }
}

function sanitizeProfile(raw: TimerProfile | Partial<TimerProfile>): TimerProfile {
  const base = createDefaultProfile();
  const p = { ...base, ...raw } as TimerProfile;
  p.background = { ...base.background, ...(raw.background as Partial<TimerProfile["background"]> ?? {}) };
  p.layout = { ...base.layout, ...(raw.layout as Partial<TimerProfile["layout"]> ?? {}) };
  p.timer = { ...base.timer, ...(raw.timer as Partial<TimerProfile["timer"]> ?? {}) };
  p.header = { ...base.header, ...(raw.header as Partial<TimerProfile["header"]> ?? {}) };
  p.footer = { ...base.footer, ...(raw.footer as Partial<TimerProfile["footer"]> ?? {}) };
  p.animation = { ...base.animation, ...(raw.animation as Partial<TimerProfile["animation"]> ?? {}) };
  p.warning = { ...base.warning, ...(raw.warning as Partial<TimerProfile["warning"]> ?? {}) };
  p.sound = { ...base.sound, ...(raw.sound as Partial<TimerProfile["sound"]> ?? {}) };
  p.id = typeof p.id === "string" && p.id ? p.id : base.id;
  p.name = typeof p.name === "string" && p.name.trim() ? p.name.trim() : base.name;
  p.durationMinutes = Math.min(180, Math.max(1, Math.round(Number(p.durationMinutes) || 50)));
  return p;
}