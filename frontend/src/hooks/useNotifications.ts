"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";

export type NotificationType =
  | "new_order"
  | "order_ready"
  | "bill_requested"
  | "waiter_called"
  | "low_stock"
  | "order_cancelled"
  | "access_request";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  tableNumber?: number;
}

const SOUND_ENABLED_KEY = "ordex-sound-enabled";

const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string }> = {
  new_order: { icon: "🍽️", color: "text-blue-400" },
  order_ready: { icon: "✅", color: "text-green-400" },
  bill_requested: { icon: "💳", color: "text-orange-400" },
  waiter_called: { icon: "🔔", color: "text-purple-400" },
  low_stock: { icon: "⚠️", color: "text-red-400" },
  order_cancelled: { icon: "❌", color: "text-red-400" },
  access_request: { icon: "🔑", color: "text-orange-400" },
};

function playNotificationSound() {
  try {
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      440,
      ctx.currentTime + 0.15,
    );

    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {}
}

export function useNotifications() {
  const { employee } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored === null ? true : stored === "true";
  });

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  function toggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_ENABLED_KEY, String(next));
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

      if (soundEnabledRef.current) {
        playNotificationSound();
      }
    },
    [],
  );

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function clearAll() {
    setNotifications([]);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    soundEnabled,
    toggleSound,
    addNotification,
    markAllRead,
    markRead,
    clearAll,
    typeConfig: TYPE_CONFIG,
  };
}
