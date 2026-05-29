"use client";

import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useNotificationContext } from "@/context/NotificationContext";


interface HeaderProps {
  title: string;
  subtitle?: string;
  restaurantId?: string;
  role?: "MANAGER" | "CASHIER";
}

export function Header({
  title,
  subtitle,
  restaurantId,
  role = "MANAGER",
}: HeaderProps) {
  const { guest, employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restId =
    restaurantId ||
    employee?.restaurantId ||
    "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const {
    notifications,
    unreadCount,
    soundEnabled,
    toggleSound,
    addNotification,
    markAllRead,
    markRead,
    clearAll,
    typeConfig,
  } = useNotificationContext();

  const name = employee?.name || guest?.name || "Usuário";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  

  function handleLogout() {
    clearAll();
    clearAuth();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {title || `Olá, ${name.split(" ")[0]}!`}
        </h1>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onClearAll={clearAll}
          typeConfig={typeConfig}
        />

        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
          <span className="text-white font-semibold text-sm">{initials}</span>
        </div>

        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-600 shadow-sm flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
