"use client";

import { useEffect } from "react";
import type { ClientRole } from "../types";
import { connectSocket, disconnectSocket } from "../realtime/client";
import { useTimerStore } from "../store/timer-store";

export function useRealtime(role: ClientRole, displayId = "main"): void {
  useEffect(() => {
    const socket = connectSocket(role, displayId, {
      onState: (payload) => useTimerStore.getState().setServerState(payload),
      onClients: (info) => useTimerStore.getState().setClients(info),
      onConnect: () => useTimerStore.getState().setConnection(true),
      onDisconnect: () => useTimerStore.getState().setConnection(false),
      onError: (message) => {
        useTimerStore.getState().setConnection(false);
        console.error("Realtime error:", message);
      },
    });

    if (!socket.active) socket.connect();

    return () => {
      disconnectSocket();
    };
  }, [role, displayId]);
}