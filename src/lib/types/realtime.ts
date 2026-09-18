import type { TimerProfile } from "./config";
import type { TimerSnapshot } from "./timer";

export type ClientRole = "admin" | "display";

export interface ServerStatePayload {
  timer: TimerSnapshot;
  activeProfileId: string | null;
  profiles: TimerProfile[];
  /** server epoch ms — clients use it to correct clock skew */
  serverTime: number;
}

export type AdminCommand =
  | { type: "timer"; payload: TimerCommandPayload }
  | { type: "profile:apply"; profileId: string }
  | { type: "profile:save"; profile: TimerProfile }
  | { type: "profile:delete"; profileId: string }
  | { type: "profile:restore" }
  | { type: "state:reset" };

export type TimerCommandPayload =
  | { cmd: "start"; profile?: TimerProfile }
  | { cmd: "pause" }
  | { cmd: "resume" }
  | { cmd: "reset"; profile?: TimerProfile }
  | { cmd: "addMinutes"; minutes: number };

export interface SocketErrorPayload {
  message: string;
}

export interface ConnectionInfo {
  role: ClientRole;
  displayId: string;
}

export const EVENTS = {
  connect: "connect",
  disconnect: "disconnect",
  state: "state",
  adminCommand: "admin:command",
  error: "app:error",
  clientsInfo: "clients:info",
} as const;