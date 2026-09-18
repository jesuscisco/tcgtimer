"use client";

import { create } from "zustand";
import type {
  AnimationConfig,
  BackgroundConfig,
  LayoutConfig,
  SectionStyle,
  ServerStatePayload,
  SoundConfig,
  TimerProfile,
  TimerSnapshot,
  TimerStyle,
  WarningConfig,
} from "../types";
import { createDefaultProfile, normalizeDurationMinutes } from "../profiles/defaults";
import { sendAdminCommand } from "../realtime/client";

export interface ClientsInfo {
  admins: number;
  displays: number;
}

interface TimerStore {
  snapshot: TimerSnapshot | null;
  clockOffset: number;
  profiles: TimerProfile[];
  activeProfileId: string | null;
  connected: boolean;
  clients: ClientsInfo;

  editing: TimerProfile;
  dirty: boolean;
  autoSave: boolean;
  shortcutsEnabled: boolean;

  setServerState: (payload: ServerStatePayload) => void;
  setConnection: (connected: boolean) => void;
  setClients: (info: ClientsInfo) => void;

  applyProfile: (id: string) => void;
  editProfile: (id: string) => void;
  createProfile: (name: string) => void;
  patchBase: (patch: Partial<TimerProfile>) => void;
  patchBackground: (patch: Partial<BackgroundConfig>) => void;
  patchLayout: (patch: Partial<LayoutConfig>) => void;
  patchTimer: (patch: Partial<TimerStyle>) => void;
  patchHeader: (patch: Partial<SectionStyle>) => void;
  patchFooter: (patch: Partial<SectionStyle>) => void;
  patchAnimation: (patch: Partial<AnimationConfig>) => void;
  patchWarning: (patch: Partial<WarningConfig>) => void;
  patchSound: (patch: Partial<SoundConfig>) => void;

  saveProfile: () => void;
  restoreActiveProfileDefaults: () => void;
  duplicateActiveProfile: () => void;
  deleteProfile: (id: string) => void;
  toggleAutoSave: () => void;
  toggleShortcuts: () => void;

  timerCommand: (cmd: "start" | "pause" | "resume" | "reset") => void;
  addMinutes: (minutes: number) => void;
  remainingMsNow: () => number;
}

function activeOf(payload: ServerStatePayload): TimerProfile {
  const p = payload.profiles.find((x) => x.id === payload.activeProfileId);
  return p ?? payload.profiles[0] ?? createDefaultProfile();
}

function initialEditing(): TimerProfile {
  return createDefaultProfile();
}

type ProfilePatch = Partial<
  Omit<
    TimerProfile,
    "background" | "layout" | "timer" | "header" | "footer" | "animation" | "warning" | "sound"
  >
> & {
  background?: Partial<BackgroundConfig>;
  layout?: Partial<LayoutConfig>;
  timer?: Partial<TimerStyle>;
  header?: Partial<SectionStyle>;
  footer?: Partial<SectionStyle>;
  animation?: Partial<AnimationConfig>;
  warning?: Partial<WarningConfig>;
  sound?: Partial<SoundConfig>;
};

function cloneProfile(p: TimerProfile, overrides?: ProfilePatch): TimerProfile {
  return {
    ...p,
    ...overrides,
    background: { ...p.background, ...(overrides?.background ?? {}) },
    layout: { ...p.layout, ...(overrides?.layout ?? {}) },
    timer: { ...p.timer, ...(overrides?.timer ?? {}) },
    header: { ...p.header, ...(overrides?.header ?? {}) },
    footer: { ...p.footer, ...(overrides?.footer ?? {}) },
    animation: { ...p.animation, ...(overrides?.animation ?? {}) },
    warning: { ...p.warning, ...(overrides?.warning ?? {}) },
    sound: { ...p.sound, ...(overrides?.sound ?? {}) },
    updatedAt: Date.now(),
  };
}

function withDirty(get: () => TimerStore, fn: (e: TimerProfile) => TimerProfile) {
  const editing = fn(get().editing);
  return { editing, dirty: true } as const;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  snapshot: null,
  clockOffset: 0,
  profiles: [],
  activeProfileId: null,
  connected: false,
  clients: { admins: 0, displays: 0 },

  editing: initialEditing(),
  dirty: false,
  autoSave: true,
  shortcutsEnabled: true,

  setServerState: (payload) =>
    set((s) => {
      const clockOffset = payload.serverTime - Date.now();
      const active = activeOf(payload);
      const editingSynced =
        !s.dirty || s.editing.id !== payload.activeProfileId || s.profiles.length === 0
          ? cloneProfile(active)
          : s.editing;

      return {
        snapshot: payload.timer,
        clockOffset,
        profiles: payload.profiles,
        activeProfileId: payload.activeProfileId,
        editing: editingSynced,
        connected: true,
      };
    }),

  setConnection: (connected) => set({ connected }),
  setClients: (info) => set({ clients: info }),

  applyProfile: (id) => {
    const profile = get().profiles.find((p) => p.id === id);
    if (!profile) return;
    set({ activeProfileId: id, editing: cloneProfile(profile), dirty: false });
    sendAdminCommand({ type: "profile:apply", profileId: id });
  },

  editProfile: (id) => {
    const profile = get().profiles.find((p) => p.id === id);
    if (!profile) return;
    set({ editing: cloneProfile(profile), dirty: false });
  },

  createProfile: (name) => {
    const p = createDefaultProfile({ name: name || "Nuevo perfil" });
    sendAdminCommand({ type: "profile:save", profile: p });
    set({ editing: cloneProfile(p), dirty: false });
  },

  patchBase: (patch) => set(() => withDirty(get, (e) => ({ ...e, ...patch }))),

  patchBackground: (patch) =>
    set(() => withDirty(get, (e) => cloneProfile(e, { background: patch }))),
  patchLayout: (patch) =>
    set(() => withDirty(get, (e) => cloneProfile(e, { layout: patch }))),
  patchTimer: (patch) =>
    set(() => withDirty(get, (e) => cloneProfile(e, { timer: patch }))),
  patchHeader: (patch) =>
    set(() => withDirty(get, (e) => cloneProfile(e, { header: patch }))),
  patchFooter: (patch) =>
    set(() => withDirty(get, (e) => cloneProfile(e, { footer: patch }))),
  patchAnimation: (patch) =>
    set(() => withDirty(get, (e) => cloneProfile(e, { animation: patch }))),
  patchWarning: (patch) =>
    set(() => withDirty(get, (e) => cloneProfile(e, { warning: patch }))),
  patchSound: (patch) =>
    set(() => withDirty(get, (e) => cloneProfile(e, { sound: patch }))),

  saveProfile: () => {
    const { editing } = get();
    sendAdminCommand({ type: "profile:save", profile: editing });
    set({ dirty: false });
  },

  restoreActiveProfileDefaults: () =>
    set(() =>
      withDirty(get, (e) =>
        cloneProfile(createDefaultProfile({ ...e, name: e.name, id: e.id, durationMinutes: e.durationMinutes }))
      )
    ),

  duplicateActiveProfile: () => {
    const { editing } = get();
    const dup = cloneProfile(editing, {
      id: `dup-${Date.now()}`,
      name: `${editing.name} (copia)`,
      createdAt: Date.now(),
    });
    sendAdminCommand({ type: "profile:save", profile: { ...dup, createdAt: Date.now() } });
  },

  deleteProfile: (id) => {
    sendAdminCommand({ type: "profile:delete", profileId: id });
  },

  toggleAutoSave: () =>
    set((s) => {
      const autoSave = !s.autoSave;
      if (autoSave) get().saveProfile();
      return { autoSave };
    }),

  toggleShortcuts: () => set((s) => ({ shortcutsEnabled: !s.shortcutsEnabled })),

  timerCommand: (cmd) => {
    const s = get();
    const profile = { ...s.editing, durationMinutes: normalizeDurationMinutes(s.editing.durationMinutes) };
    sendAdminCommand({ type: "timer", payload: { cmd, profile } });
  },

  addMinutes: (minutes) => {
    sendAdminCommand({ type: "timer", payload: { cmd: "addMinutes", minutes } });
  },

  remainingMsNow: () => {
    const s = get();
    const snap = s.snapshot;
    if (!snap) return 0;
    if (snap.status === "RUNNING" && snap.endTime !== null) {
      return Math.max(0, snap.endTime - (Date.now() + s.clockOffset));
    }
    return snap.remainingMs;
  },
}));