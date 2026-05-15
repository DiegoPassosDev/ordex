"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { useAuthStore } from "@/store/auth.store";
import { useSocket } from "@/hooks/useSocket";

// ── Tipos ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "new_order"
  | "order_ready"
  | "bill_requested"
  | "waiter_called"
  | "low_stock"
  | "order_cancelled";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  tableNumber?: number;
}

export const TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; color: string }
> = {
  new_order: { icon: "🍽️", color: "text-blue-400" },
  order_ready: { icon: "✅", color: "text-green-400" },
  bill_requested: { icon: "💳", color: "text-orange-400" },
  waiter_called: { icon: "🔔", color: "text-purple-400" },
  low_stock: { icon: "⚠️", color: "text-red-400" },
  order_cancelled: { icon: "❌", color: "text-red-400" },
};

// ── Contexto ─────────────────────────────────────────────────────────────────

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  toggleSound: () => void;
  addNotification: (
    type: NotificationType,
    title: string,
    message: string,
    tableNumber?: number,
  ) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  typeConfig: typeof TYPE_CONFIG;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

const SOUND_KEY = "ordex-sound-enabled";

// ── Som ──────────────────────────────────────────────────────────────────────

function playSound() {
  try {
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();

    const beep = (startTime: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    };

    beep(ctx.currentTime, 660);
    beep(ctx.currentTime + 0.2, 880);
  } catch {}
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { employee, restaurantId } = useAuthStore();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(SOUND_KEY);
    return stored === null ? true : stored === "true";
  });

  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  function toggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_KEY, String(next));
      return next;
    });
  }

  const addNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      tableNumber?: number,
    ) => {
      const notif: AppNotification = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        title,
        message,
        timestamp: new Date(),
        read: false,
        tableNumber,
      };

      setNotifications((prev) => [notif, ...prev].slice(0, 50));

      if (soundRef.current) playSound();
    },
    [],
  );

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function clearAll() {
    setNotifications([]);
  }

  // Só conecta o socket se for um funcionário (manager, waiter, kitchen…)
  // Clientes não recebem notificações globais
  const restId =
    employee?.restaurantId ||
    restaurantId ||
    "f4385ae5-6187-40f8-97b4-d289d47dc441";

  useSocket(employee ? { type: "restaurant", id: restId } : null, {
    new_order: (order: any) => {
      addNotification(
        "new_order",
        "Novo Pedido",
        `Mesa ${order?.session?.table?.number ?? "?"} fez um pedido`,
        order?.session?.table?.number,
      );
    },
    order_status_updated: (order: any) => {
      if (order?.status === "READY") {
        addNotification(
          "order_ready",
          "Pedido Pronto",
          `Mesa ${order?.session?.table?.number ?? "?"} — pronto para entregar`,
          order?.session?.table?.number,
        );
      }
      if (order?.status === "CANCELLED") {
        addNotification(
          "order_cancelled",
          "Pedido Cancelado",
          `Mesa ${order?.session?.table?.number ?? "?"} cancelou um pedido`,
          order?.session?.table?.number,
        );
      }
    },
    bill_requested: (data: any) => {
      addNotification(
        "bill_requested",
        "Conta Solicitada",
        `Mesa ${data?.tableNumber ?? "?"} está pedindo a conta`,
        data?.tableNumber,
      );
    },
    waiter_called: (data: any) => {
      addNotification(
        "waiter_called",
        "Garçom Solicitado",
        `Mesa ${data?.tableNumber ?? "?"}: ${data?.reason ?? "Chamando garçom"}`,
        data?.tableNumber,
      );
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        soundEnabled,
        toggleSound,
        addNotification,
        markRead,
        markAllRead,
        clearAll,
        typeConfig: TYPE_CONFIG,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ── Hook de acesso ────────────────────────────────────────────────────────────

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotificationContext deve ser usado dentro de NotificationProvider",
    );
  }
  return ctx;
}
