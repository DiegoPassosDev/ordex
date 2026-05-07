import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

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

  useEffect(() => {
    if (!room?.id) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (room.type === "session") {
        socket.emit("join_session", room.id);
      } else {
        socket.emit("join_restaurant", room.id);
      }
    });

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      socket.disconnect();
    };
  }, [room?.id, room?.type]);

  return socketRef.current;
}
