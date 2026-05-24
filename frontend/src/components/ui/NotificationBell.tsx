"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, BellOff, X, CheckCheck, Trash2 } from "lucide-react";
import { AppNotification, NotificationType } from "@/hooks/useNotifications";

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  typeConfig: Record<NotificationType, { icon: string; color: string }>;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

export function NotificationBell({
  notifications,
  unreadCount,
  soundEnabled,
  onToggleSound,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  typeConfig,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    setOpen((prev) => !prev);
  }

  return (
    <div ref={ref} className="relative">
      {/* Botão do sino */}
      <button
        onClick={handleOpen}
        className="relative w-10 h-10 rounded-xl bg-gray-800 border border-gray-600 shadow-sm flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col max-h-[480px]">
          {/* Header do dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-sm">Notificações</h3>
            </div>
            <div className="flex items-center gap-1">
              {/* Toggle som */}
              <button
                onClick={onToggleSound}
                title={soundEnabled ? "Silenciar" : "Ativar som"}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  soundEnabled
                    ? "text-orange-400 hover:bg-orange-500/10"
                    : "text-gray-500 hover:bg-gray-700"
                }`}
              >
                {soundEnabled ? (
                  <Bell className="w-3.5 h-3.5" />
                ) : (
                  <BellOff className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Marcar todas como lidas */}
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  title="Marcar todas como lidas"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Limpar tudo */}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  title="Limpar todas"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Fechar */}
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Lista de notificações */}
          <div className="flex-1 overflow-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="w-10 h-10 text-gray-600 mb-3" />
                <p className="text-gray-500 text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/50">
                {notifications.map((notif) => {
                  const config = typeConfig[notif.type];
                  return (
                    <button
                      key={notif.id}
                      onClick={() => onMarkRead(notif.id)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-700/50 transition-all ${
                        !notif.read ? "bg-orange-500/5" : ""
                      }`}
                    >
                      {/* Ícone */}
                      <div className="w-8 h-8 rounded-xl bg-gray-700 flex items-center justify-center shrink-0 text-base">
                        {config.icon}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-sm font-medium truncate ${config.color}`}
                          >
                            {notif.title}
                          </p>
                          <span className="text-xs text-gray-500 shrink-0">
                            {timeAgo(notif.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {notif.message}
                        </p>
                      </div>

                      {/* Indicador não lida */}
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
