"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWaiterPage } from "./useWaiterPage";
import { WaiterSessionDetail } from "./WaiterSessionDetail";
import { WaiterOpenTableModal } from "./modal/WaiterOpenTableModal";
import { ThemeToggle } from "@/components/theme/ThemeProvider";
import { NotificationBell } from "@/components/ui/NotificationBell";
import {
  UtensilsCrossed,
  Bell,
  CheckCheck,
  AlertCircle,
  ChevronRight,
  Flame,
  Loader2,
  LogOut,
  User,
  X,
  Plus,
} from "lucide-react";
import { CustomToaster } from "@/components/ui/Toast";

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

export default function WaiterPage() {
  useRequireAuth("WAITER");
  const p = useWaiterPage();

  if (!p.mounted) return null;

  if (p.selectedSession) {
    return (
      <WaiterSessionDetail
        session={p.selectedSession}
        restaurantId={p.restaurantId}
        onBack={() => p.setSelectedSession(null)}
        onAcceptTable={p.handleAcceptTable}
        onDeliverOrder={p.handleDeliverOrder}
        onCloseBill={p.handleCloseBill}
        onOrderPlaced={p.handleOrderPlaced}
        getSessionStatus={p.getSessionStatus}
        getSessionTotal={p.getSessionTotal}
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
                <Flame className="w-4 h-4 text-white" />
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
                className="w-9 h-9 rounded-xl bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-400 hover:bg-orange-500/20 hover:text-orange-400 transition-all"
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
            <p className="text-xl font-bold text-white">{p.sessions.length}</p>
            <p className="text-xs text-gray-500 text-center">Mesas ativas</p>
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

            {!p.loading && p.sessions.length === 0 && (
              <div className="text-center py-16">
                <UtensilsCrossed className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhuma mesa ativa</p>
              </div>
            )}

            {[...p.sessions].sort((a, b) => (a.table?.number || 0) - (b.table?.number || 0)).map((session) => {
              const status = p.getSessionStatus(session);
              const config = tableStatusConfig[status];
              const readyOrders =
                session.orders?.filter((o) => o.status === "READY") || [];
              const isUnassigned = !session.waiterId;

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
              Alertas Ativos
            </p>

            {p.alerts === 0 && (
              <div className="text-center py-16">
                <CheckCheck className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Nenhum alerta no momento
                </p>
              </div>
            )}

            {p.sessions
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
                        <p key={i} className="text-sm text-gray-300 mb-1">
                          {item.quantity}x {item.menuItem?.name}
                        </p>
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

            {p.sessions
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

      {/* Botão flutuante abrir mesa */}
      <button
        onClick={() => p.setShowOpenTableModal(true)}
        className="fixed bottom-4 left-4 z-30 w-12 h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-900/40 flex items-center justify-center transition-all"
        title="Abrir mesa para cliente"
      >
        <Plus className="w-5 h-5" />
      </button>

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
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => p.setAccessRequest(null)} />
          <div className="relative w-full max-w-md mx-auto bg-gray-800 border-t border-gray-700 rounded-t-3xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">Solicitação de Acesso</h3>
              <button onClick={() => p.setAccessRequest(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-2xl mb-5">
              <User className="w-8 h-8 text-orange-400 shrink-0" />
              <div>
                <p className="text-white font-semibold">{p.accessRequest.guestName}</p>
                <p className="text-sm text-gray-400">
                  quer entrar na Mesa {p.accessRequest.tableNumber}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => p.handleRespondAccess(false)}
                className="flex-1 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/20 transition-all"
              >
                Negar
              </button>
              <button
                onClick={() => p.handleRespondAccess(true)}
                className="flex-1 py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-all"
              >
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}

      {p.profileModalState !== "closed" && (
        <>
          <div
            className={`fixed inset-0 z-50 bg-black/60 ${
              p.profileModalState === "open"
                ? "animate-fade-in"
                : "animate-fade-out"
            }`}
            onClick={p.closeProfileModal}
          />
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center ${
              p.profileModalState === "open"
                ? "animate-slide-up"
                : "animate-slide-down"
            }`}
          >
            <div className="w-full max-w-md mx-auto bg-gray-800 border-t border-gray-700 rounded-t-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white text-lg">Perfil</h3>
                <button onClick={p.closeProfileModal}>
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
                onClick={p.handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
