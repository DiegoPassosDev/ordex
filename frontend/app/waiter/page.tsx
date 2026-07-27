"use client";

import React from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWaiterPage } from "./useWaiterPage";
import { WaiterSessionDetail } from "./WaiterSessionDetail";
import { WaiterOpenTableModal } from "./modal/WaiterOpenTableModal";
import { ThemeToggle } from "@/components/theme/ThemeProvider";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";
import {
  UtensilsCrossed,
  Bell,
  CheckCheck,
  AlertCircle,
  ChevronRight,
  Loader2,
  LogOut,
  User,
  X,
  Plus,
} from "lucide-react";
import { CustomToaster } from "@/components/ui/Toast";
import { SlideUpModal, useSlideUpClose } from "@/components/ui/SlideUpModal";
import { ORDER_STATUS_DOT, ORDER_STATUS_LABEL } from "@/types";

const tableStatusConfig: Record<
  string,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  active: {
    label: "Ativa",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
    dot: "bg-green-400",
  },
  bill: {
    label: "Pedindo Conta",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    dot: "bg-orange-400",
  },
  call: {
    label: "Chamando",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
};

function AccessRequestContent({ p }: { p: ReturnType<typeof useWaiterPage> }) {
  const { close } = useSlideUpClose();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-white text-lg">Solicitação de Acesso</h3>
        <button onClick={close}>
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-2xl mb-5">
        <User className="w-8 h-8 text-orange-400 shrink-0" />
        <div>
          <p className="text-white font-semibold">{p.accessRequest!.guestName}</p>
          <p className="text-sm text-gray-400">
            quer entrar na Mesa {p.accessRequest!.tableNumber}
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => { p.handleRespondAccess(false); close(); }}
          className="flex-1 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/20 transition-all"
        >
          Negar
        </button>
        <button
          onClick={() => { p.handleRespondAccess(true); close(); }}
          className="flex-1 py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-all"
        >
          Aprovar
        </button>
      </div>
    </div>
  );
}

function ProfileContent({ p }: { p: ReturnType<typeof useWaiterPage> }) {
  const { close } = useSlideUpClose();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-white text-lg">Perfil</h3>
        <button onClick={close}>
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-700/50 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold">
            {p.employee?.name
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "?"}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-white truncate">
            {p.employee?.name || "Garçom"}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {p.employee?.email || "Garçom"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 bg-gray-700/30 rounded-xl mb-4">
        <span className="text-sm text-gray-300">Tema</span>
        <ThemeToggle />
      </div>
      <button
        onClick={() => setShowLogoutModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/20 transition-all"
      >
        <LogOut className="w-4 h-4" />
        Sair da conta
      </button>
      <LogoutConfirmModal
        open={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={p.handleLogout}
      />
    </div>
  );
}

export default function WaiterPage() {
  useRequireAuth("WAITER");
  const p = useWaiterPage();

  if (!p.mounted) return null;

  if (p.selectedSession) {
    return (
      <WaiterSessionDetail
        session={p.selectedSession}
        restaurantId={p.restaurantId}
        employeeId={p.employee?.id ?? ""}
        onBack={() => p.setSelectedSession(null)}
        onAcceptTable={p.handleAcceptTable}
        onDeliverOrder={p.handleDeliverOrder}
        onOrderPlaced={p.handleOrderPlaced}
        getSessionStatus={p.getSessionStatus}
        getSessionTotal={p.getSessionTotal}
        notifications={p.notifications}
        unreadCount={p.unreadCount}
        soundEnabled={p.soundEnabled}
        onToggleSound={p.toggleSound}
        onMarkRead={p.markRead}
        onMarkAllRead={p.markAllRead}
        onClearAll={p.clearAll}
        typeConfig={p.typeConfig}
      />
    );
  }

  return (
    <div className="h-dvh bg-gray-900 w-full max-w-md mx-auto flex flex-col">
      <CustomToaster />

      <div className="shrink-0">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 563 550" className="w-8 h-8"><path fill="white" d="M266 84.6c-58.2 5.3-108 33.5-140.9 79.9-32.2 45.3-42.8 103.3-29 158 6.4 25.2 18.3 49.1 35.4 71 7.5 9.6 25.2 26.9 35.5 34.6 44.2 33.2 101.3 45.5 155 33.4 55.8-12.6 105.9-52.8 130.4-104.7 8.1-17.1 12.4-30.8 16.2-51.8 2.7-14.7 2.5-45.5-.5-62.5-4.2-24.1-14.5-50.8-27.3-70.8l-5.1-7.9-3.4 4c-1.8 2.3-5 5.1-7.1 6.3-2 1.2-3.9 2.4-4.1 2.5-.2.2 1.5 3.2 3.7 6.6 11.3 18 19.8 39.7 23.8 61.3 2.9 15.5 2.7 48.1-.4 63-7.4 35-23.8 65.2-48.4 89.1-14.4 14-26.2 22.5-43 31-44.1 22.1-94.4 24.1-140.3 5.4-5.5-2.2-10.3-4.4-10.7-4.8s5.7-7.2 13.6-15.1l14.3-14.3 8.2 2.6c17.5 5.6 42.4 7.2 60.7 4.1 40.3-6.9 76.3-33.2 95.3-69.4 4.6-8.9 12.8-30.7 11.8-31.7-.2-.2-2.7-.8-5.5-1.4-2.8-.5-6.8-1.6-8.8-2.5-2-.8-3.9-1.3-4.1-1.1-.3.2-1.1 2.9-1.9 6.1-2.3 8.7-8.1 21.2-14 30.1-21.2 32.1-56.4 51.4-93.8 51.4-10.7 0-26.7-2.2-29.6-4-1.2-.7 8.8-11.2 43.5-46l45-45.1 3.6.6c8 1.4 17.3-3.4 21-10.7 3.1-6.1 2.4-16-1.5-21.6-3.7-5.3-9.5-8.2-16.8-8.2-11.6 0-19.8 8.1-20.3 20l-.2 6.1-69.8 69.5-69.8 69.4-2.6-1.6c-4.3-2.8-12.7-9.3-14.7-11.5-1.8-2-.7-3.1 115.1-118.9l117-117h5.3c9 0 15.5-3.8 19.4-11.4 2.8-5.5 2.2-15.9-1.1-20.8-5.2-7.5-14.3-10.8-22.9-8.3-9.2 2.8-16.4 13.6-14.7 22.3.6 3.3.3 3.9-6.1 10.4-7.1 7.1-8.4 7.7-10.4 5.4-2.2-2.8-18.8-13.6-26.9-17.6-10.6-5.3-26.3-10.5-38.1-12.6-5.2-.9-10.2-2.2-11-2.9-5.8-4.8-16.6-6.4-22.5-3.3-3.7 2-7.8 6.3-9.9 10.5-2 3.9-2.1 12.2-.3 16.6 1.9 4.5 8.8 10.4 13.7 11.7 8.6 2.3 18.6-1.8 23.2-9.6 2-3.4 2.3-3.5 6.2-2.9 15.2 2.6 39.6 14.2 51.5 24.5l2.4 2.1-102.7 102.7c-87 86.9-103 102.5-104.4 101.6-.9-.6-4.6-4.8-8-9.4l-6.4-8.3 68.9-68.9 68.8-68.8h5.8c7.1 0 11.7-2 15.7-6.8 6.7-8.1 6.1-20.2-1.4-27.6-8.4-8.4-19.3-8.6-28.1-.5-4.8 4.4-7 10.2-6.3 16.8l.3 4.1-43.6 43.6c-28.1 28.1-44.2 43.5-45.1 43.1-2.1-.8-4.8-17.5-4.8-29.9 0-35.8 16.7-68.7 46.5-91.4 6.8-5.1 25.7-14.7 32.5-16.4 7.4-1.8 7.1-1.5 5-6.2-1.1-2.5-2-6.5-2-9.6 0-3.6-.4-5.2-1.3-5.2-3.2 0-19.6 6.3-28.6 11.1-25.4 13.2-46.6 35.3-59.1 61.4-14.1 29.4-16.5 67.5-6 98.4l1.8 5.4-13.8 13.9c-7.6 7.6-14.5 13.8-15.3 13.8-3.6 0-14.3-34.1-16.7-53.2-1.8-14-.8-40.5 1.9-54.1 13.5-66.9 64.8-119.2 130.6-133.3 31.2-6.7 60.1-5.2 91 4.6 10 3.2 30.4 12.8 38 17.9 2.2 1.5 4.5 3.1 5.2 3.4.7.4 2.2-1.1 3.7-3.8 1.5-2.4 4.2-5.7 6.1-7.2 1.9-1.6 3.5-3.1 3.5-3.4 0-.4-3.5-2.9-7.7-5.6-22.1-14.3-44.1-22.7-71.1-27.3-11.3-2-36.6-3.3-46.2-2.4"/><path fill="white" d="m387.3 198.3-7.1 7.2 2.5 3.5c5.2 7.2 13.3 25.4 15.4 34.8l2.2 9.4-4.2 3.6c-7.3 6.6-9.3 16.8-4.8 25.3 6.6 12.5 23.5 14.5 33.1 3.9 7.4-8.2 7.3-19-.3-27.4-3.3-3.5-4-5.3-5.5-13-3.1-15.9-12.4-38.1-20.8-49.8l-3.4-4.7z"/></svg>
              </div>
              <div>
                <p className="font-bold text-white text-sm">Ordex — Garçom</p>
                <p className="text-xs text-gray-400">
                  {p.employee?.name || "Minhas mesas"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell
                notifications={p.notifications}
                unreadCount={p.unreadCount}
                soundEnabled={p.soundEnabled}
                onToggleSound={p.toggleSound}
                onMarkRead={p.markRead}
                onMarkAllRead={p.markAllRead}
                onClearAll={p.clearAll}
                typeConfig={p.typeConfig}
              />
              <button
                onClick={p.openProfileModal}
                className="w-10 h-10 rounded-xl bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-400 hover:bg-orange-500/20 hover:text-orange-400 transition-all"
                title="Perfil"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-3 bg-gray-700/50 rounded-xl p-1">
            <button
              onClick={() => p.setTab("tables")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                p.tab === "tables"
                  ? "bg-gray-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 shrink-0" />
              Mesas
            </button>
            <button
              onClick={() => p.setTab("alerts")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                p.tab === "alerts"
                  ? "bg-gray-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              Alertas
              {p.alerts > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shrink-0">
                  {p.alerts}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 px-4 py-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-3 flex flex-col items-center gap-1">
            <p className="text-xl font-bold text-white">{p.mySessions.length}</p>
            <p className="text-xs text-gray-500 text-center">Suas mesas</p>
          </div>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-3 flex flex-col items-center gap-1">
            <p className="text-xl font-bold text-green-400">
              {p.pendingDeliveries}
            </p>
            <p className="text-xs text-gray-500 text-center">Prontos</p>
          </div>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-3 flex flex-col items-center gap-1">
            <p className="text-xl font-bold text-purple-400">{p.alerts}</p>
            <p className="text-xs text-gray-500 text-center">Alertas</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {p.tab === "tables" && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Suas Mesas
            </p>

            {p.loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              </div>
            )}

            {!p.loading && p.mySessions.length === 0 && (
              <div className="text-center py-16">
                <UtensilsCrossed className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhuma mesa ativa</p>
              </div>
            )}

            {[...p.mySessions].sort((a, b) => (a.table?.number || 0) - (b.table?.number || 0)).map((session) => {
              const status = p.getSessionStatus(session);
              const config = tableStatusConfig[status];
              const readyOrders =
                session.orders?.filter((o) => o.status === "READY") || [];

              return (
                <div
                  key={session.id}
                  onClick={() => p.setSelectedSession(session)}
                  className="bg-gray-800 rounded-2xl border border-gray-700 p-4 cursor-pointer hover:border-orange-500/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <span className="text-orange-400 font-bold">
                          {session.table?.number}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          Mesa {session.table?.number}
                        </p>
                        <p className="text-xs text-gray-400">
                          {session.guests?.[0]?.name?.split(" ")[0] || session.guestLabel?.split(" ")[0] || `Mesa ${session.table?.number}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.border} ${config.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                        />
                        {config.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>

                  {readyOrders.length > 0 && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 mb-2">
                      <p className="text-xs font-medium text-green-400">
                        ✅ {readyOrders.length} item(s) pronto(s) para entregar
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                    <span className="text-xs text-gray-500">
                      Total acumulado
                    </span>
                    <span className="text-sm font-bold text-white">
                      R$ {p.getSessionTotal(session).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {p.tab === "alerts" && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Alertas
            </p>

            {p.alerts === 0 && (
              <div className="text-center py-16">
                <CheckCheck className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Nenhum alerta no momento
                </p>
              </div>
            )}

            {p.availableSessions.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Mesas sem Garçom
                </p>

                {[...p.availableSessions].sort((a, b) => (a.table?.number || 0) - (b.table?.number || 0)).map((session) => (
                  <div
                    key={session.id}
                    onClick={() => p.setSelectedSession(session)}
                    className="bg-gray-800 rounded-2xl border border-blue-500/30 p-4 cursor-pointer hover:border-blue-400/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <span className="text-blue-400 font-bold">
                            {session.table?.number}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            Mesa {session.table?.number}
                          </p>
                          <p className="text-xs text-gray-400">
                            {session.guests?.[0]?.name?.split(" ")[0] || session.guestLabel?.split(" ")[0] || `Mesa ${session.table?.number}`}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {p.mySessionAlerts.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Suas Mesas
                </p>

            {p.mySessions
              .filter((s) => s.orders?.some((o) => o.status === "READY"))
              .map((session) => (
                <div
                  key={session.id}
                  className="bg-gray-800 rounded-2xl border border-green-500/30 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCheck className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-semibold text-white">
                        Mesa {session.table?.number}
                      </span>
                    </div>
                    <span className="text-xs text-green-400 font-medium">
                      Pronto p/ Servir
                    </span>
                  </div>
                  {session.orders
                    ?.filter((o) => o.status === "READY")
                    .map((o) =>
                      o.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1">
                          <span className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold shrink-0">
                            {item.quantity}
                          </span>
                          <span className="text-sm text-gray-300 flex-1 truncate">
                            {item.menuItem?.name}
                          </span>
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-700/50 border border-gray-600/50 text-gray-400">
                            <span className={`w-1.5 h-1.5 rounded-full ${ORDER_STATUS_DOT[item.status]}`} />
                            {ORDER_STATUS_LABEL[item.status]}
                          </span>
                        </div>
                      )),
                    )}
                  <button
                    onClick={() => p.setSelectedSession(session)}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium transition-all"
                  >
                    Ver mesa
                  </button>
                </div>
              ))}

            {p.mySessions
              .filter((s) => s.status === "REQUESTING_BILL")
              .map((session) => (
                <div
                  key={session.id}
                  className="bg-gray-800 rounded-2xl border border-orange-500/30 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-semibold text-white">
                        Mesa {session.table?.number}
                      </span>
                    </div>
                    <span className="text-xs text-orange-400 font-medium">
                      Pedindo Conta
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    Total — R$ {p.getSessionTotal(session).toFixed(2)}
                  </p>
                  <button
                    onClick={() => p.handleCloseBill(session.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium transition-all"
                  >
                    Fechar conta
                  </button>
                </div>
              ))}
            </div>
          )}
          </div>
        )}
      </div>

      {/* Botão flutuante abrir mesa */}
      <div className="fixed bottom-4 left-4 z-30 flex items-center gap-2">
        <button
          onClick={() => p.setShowOpenTableModal(true)}
          className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-900/40 flex items-center justify-center transition-all"
          title="Abrir mesa para cliente"
        >
          <Plus className="w-5 h-5" />
        </button>
        <span className="px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium backdrop-blur-sm">
          Abrir mesa
        </span>
      </div>

      {p.showOpenTableModal && p.employee && (
        <WaiterOpenTableModal
          restaurantId={p.restaurantId}
          waiterId={p.employee.id}
          onOpen={p.handleOpenTable}
          onClose={() => p.setShowOpenTableModal(false)}
        />
      )}

      {/* Modal de solicitação de acesso */}
      {p.accessRequest && (
        <SlideUpModal onClose={() => p.setAccessRequest(null)}>
          <AccessRequestContent p={p} />
        </SlideUpModal>
      )}

      {p.profileModalState !== "closed" && (
        <SlideUpModal onClose={() => p.setProfileModalState("closed")}>
          <ProfileContent p={p} />
        </SlideUpModal>
      )}
    </div>
  );
}
