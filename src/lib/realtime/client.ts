import { io, type Socket } from "socket.io-client";
import type { AdminCommand, ClientRole, ServerStatePayload } from "../types";
import { EVENTS } from "../types";

let socket: Socket | null = null;
let currentRole: ClientRole | null = null;
let currentDisplayId: string | null = null;

type Handlers = {
  onState?: (payload: ServerStatePayload) => void;
  onClients?: (payload: { admins: number; displays: number }) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (message: string) => void;
};

export function connectSocket(role: ClientRole, displayId: string, handlers: Handlers): Socket {
  if (
    socket &&
    currentRole === role &&
    currentDisplayId === displayId &&
    socket.connected
  ) {
    attachHandlers(socket, handlers);
    return socket;
  }
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentRole = role;
  currentDisplayId = displayId;

  socket = io({
    query: { role, displayId },
    transports: ["websocket", "polling"],
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
  });

  attachHandlers(socket, handlers);
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentRole = null;
    currentDisplayId = null;
  }
}

function attachHandlers(s: Socket, handlers: Handlers): void {
  if (handlers.onState) {
    s.off(EVENTS.state);
    s.on(EVENTS.state, handlers.onState);
  }
  if (handlers.onClients) {
    s.off(EVENTS.clientsInfo);
    s.on(EVENTS.clientsInfo, handlers.onClients);
  }
  if (handlers.onConnect) {
    s.off(EVENTS.connect);
    s.on(EVENTS.connect, handlers.onConnect);
  }
  if (handlers.onDisconnect) {
    s.off(EVENTS.disconnect);
    s.on(EVENTS.disconnect, handlers.onDisconnect);
  }
  if (handlers.onError) {
    s.off(EVENTS.error);
    s.on(EVENTS.error, (e: { message: string }) => handlers.onError?.(e.message));
  }
}

export function sendAdminCommand(command: AdminCommand): void {
  if (!socket) return;
  socket.emit(EVENTS.adminCommand, command);
}

export function isConnected(): boolean {
  return socket?.connected ?? false;
}