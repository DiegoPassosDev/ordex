import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";

function getSocketUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3001`;
  }

  return "http://localhost:3001";
}

const SOCKET_URL = getSocketUrl();

export function useSocket(
  room: { type: "session" | "restaurant"; id: string } | null,
  handlers: Record<string, (data: any) => void>,
) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  const token = useAuthStore((state) => state.token);
  const eventNames = Object.keys(handlers).sort().join("|");

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!room?.id || !token) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (room.type === "session") {
        socket.emit("join_session", room.id);
      } else {
        socket.emit("join_restaurant", room.id);
      }
    });

    eventNames.split("|").filter(Boolean).forEach((event) => {
      socket.on(event, (data) => handlersRef.current[event]?.(data));
    });

    return () => {
      socket.disconnect();
    };
  }, [eventNames, room?.id, room?.type, token]);
}
