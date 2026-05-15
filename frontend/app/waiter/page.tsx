"use client";

import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth.store";
import { sessionsService } from "@/services/sessions.service";
import { ordersService } from "@/services/orders.service";
import { useSocket } from "@/hooks/useSocket";
import {
  UtensilsCrossed,
  Bell,
  CheckCheck,
  AlertCircle,
  ChevronRight,
  Flame,
  Loader2,
} from "lucide-react";
import { TableSession } from "@/types";
import { CustomToaster, toast } from "@/components/ui/Toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationBell } from "@/components/ui/NotificationBell";

type Tab = "tables" | "alerts";

const tableStatusConfig = {
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
  const { employee } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [sessions, setSessions] = useState<TableSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TableSession | null>(
    null,
  );
  const [tab, setTab] = useState<Tab>("tables");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
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
  } = useNotifications();

  useEffect(() => {
    setMounted(true);
    loadSessions();
  }, []);

  useSocket(
    { type: "restaurant", id: restaurantId },
    {
      table_session_updated: () => {
        loadSessions();
      },
      new_order: () => {
        loadSessions();
        addNotification(
          "new_order",
          "Novo Pedido",
          "Novo pedido recebido!",
        );
        toast.success("Novo pedido recebido!");        
      },
      order_status_updated: (order: any) => {
        if (order.status === "READY") {
          addNotification(
            "order_ready",
            "Pedido Pronto",
            `Mesa ${order.session?.table?.number} — pronto para entregar`,
            order.session?.table?.number,
          );
          toast.success(
            `Pedido pronto — Mesa ${order.session?.table?.number}!`,
          );
        }
        loadSessions();
      },
      waiter_called: (data: any) => {
        addNotification(
          "waiter_called",
          "Garçom Chamado",
          `Mesa ${data.tableNumber}: ${data.reason}`,
          data.tableNumber,
        );
        toast(`Mesa ${data.tableNumber}: ${data.reason}`, { icon: "🔔" });
        loadSessions();
      },
      bill_requested: () => {
        addNotification(
          "bill_requested",
          "Conta Solicitada",
          "Cliente pedindo a conta!",
        );
        toast("Cliente pedindo a conta!", { icon: "💳" });
        loadSessions();
      },
    },
  );

  async function loadSessions() {
    try {
      setLoading(true);
      const data = await sessionsService.getActiveByRestaurant(restaurantId);
      setSessions(data);
    } catch {
      toast.error("Erro ao carregar mesas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptTable(sessionId: string) {
    if (!employee) return;
    try {
      await sessionsService.assignWaiter(sessionId, employee.id);
      toast.success("Mesa aceita!");
      loadSessions();
      // Atualiza o selectedSession para refletir o novo garçom imediatamente
      const updated = await sessionsService.getOne(sessionId);
      setSelectedSession(updated);
    } catch {
      toast.error("Erro ao aceitar mesa.");
    }
  }

  async function handleDeliverOrder(orderId: string) {
    try {
      await ordersService.updateStatus(orderId, "DELIVERED");
      toast.success("Pedido entregue!");
      loadSessions();
      if (selectedSession) {
        const updated = await sessionsService.getOne(selectedSession.id);
        setSelectedSession(updated);
      }
    } catch {
      toast.error("Erro ao confirmar entrega.");
    }
  }

  async function handleCloseBill(sessionId: string) {
    try {
      await sessionsService.close(sessionId);
      toast.success("Conta fechada! Mesa liberada.");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSelectedSession(null);
    } catch {
      toast.error("Erro ao fechar conta.");
    }
  }

  function getSessionStatus(session: TableSession): "active" | "bill" | "call" {
    if (session.status === "REQUESTING_BILL") return "bill";
    const hasReady = session.orders?.some((o) => o.status === "READY");
    if (hasReady) return "call";
    return "active";
  }

  function getSessionTotal(session: TableSession): number {
    return (
      session.orders?.reduce((acc, o) => {
        if (o.status === "CANCELLED") return acc;
        return acc + o.items.reduce((s, i) => s + i.price * i.quantity, 0);
      }, 0) || 0
    );
  }

  const pendingDeliveries = sessions.reduce(
    (acc, s) =>
      acc + (s.orders?.filter((o) => o.status === "READY").length || 0),
    0,
  );
  const alerts = sessions.filter(
    (s) =>
      s.status === "REQUESTING_BILL" ||
      s.orders?.some((o) => o.status === "READY"),
  ).length;

  if (!mounted) return null;

  /* ── Tela de detalhe da sessão ── */
  if (selectedSession) {
    const status = getSessionStatus(selectedSession);
    const config = tableStatusConfig[status];
    const readyOrders =
      selectedSession.orders?.filter((o) => o.status === "READY") || [];
    const isUnassigned = !selectedSession.waiterId;

    return (
      <div className="min-h-screen bg-gray-900 w-full max-w-md mx-auto">
        <CustomToaster />
        <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40 px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedSession(null)}
              className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-gray-300 text-base"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-orange-400 text-xs font-bold">
                  {selectedSession.table?.number}
                </span>
              </div>
              <div>
                <p className="font-bold text-white text-sm">
                  Mesa {selectedSession.table?.number}
                </p>
                <p className="text-xs text-gray-400">
                  {isUnassigned
                    ? "Sem garçom"
                    : `Garçom: ${selectedSession.waiter?.name || "Você"}`}
                </p>
              </div>
            </div>
            <span
              className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.border} ${config.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              {config.label}
            </span>
          </div>
        </div>

        <div className="px-4 py-4 pb-12 space-y-4">
          {/* Aceitar mesa */}
          {isUnassigned && (
            <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300">Mesa sem garçom</span>
              </div>
              <Button
                size="sm"
                onClick={() => handleAcceptTable(selectedSession.id)}
              >
                Aceitar
              </Button>
            </div>
          )}

          {/* Pedindo conta */}
          {selectedSession.status === "REQUESTING_BILL" && (
            <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-orange-300">
                  Cliente pedindo a conta
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => handleCloseBill(selectedSession.id)}
              >
                Fechar
              </Button>
            </div>
          )}

          {/* Itens prontos */}
          {readyOrders.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-3">
              <p className="text-xs font-medium text-green-400 mb-1">
                ✅ {readyOrders.length} item(s) pronto(s)
              </p>
              {readyOrders.map((o) =>
                o.items.map((item, i) => (
                  <p key={i} className="text-xs text-green-300">
                    {item.quantity}x {item.menuItem?.name}
                  </p>
                )),
              )}
            </div>
          )}

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Pedidos
          </p>

          <div className="space-y-3">
            {selectedSession.orders?.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                Nenhum pedido ainda
              </p>
            )}
            {selectedSession.orders?.map((order) => (
              <div
                key={order.id}
                className="bg-gray-800 rounded-2xl border border-gray-700 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <StatusBadge status={order.status} />
                  {order.status === "READY" && (
                    <Button
                      size="sm"
                      icon={CheckCheck}
                      onClick={() => handleDeliverOrder(order.id)}
                    >
                      Entregar
                    </Button>
                  )}
                </div>
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 mt-2">
                    <span className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
                      {item.quantity}
                    </span>
                    <span className="text-sm text-gray-200">
                      {item.menuItem?.name}
                    </span>
                    {item.notes && (
                      <span className="text-xs text-gray-400 italic">
                        — {item.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-2xl border border-gray-700 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-400">Total acumulado</span>
            <span className="text-base font-bold text-white">
              R$ {getSessionTotal(selectedSession).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Tela principal ── */
  return (
    <div className="min-h-screen bg-gray-900 w-full max-w-md mx-auto">
      <CustomToaster />
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Ordex — Garçom</p>
              <p className="text-xs text-gray-400">
                {employee?.name || "Minhas mesas"}
              </p>
            </div>
          </div>
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
        </div>

        <div className="flex gap-1 mt-3 bg-gray-700/50 rounded-xl p-1">
          <button
            onClick={() => setTab("tables")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "tables"
                ? "bg-gray-600 text-white shadow-sm"
                : "text-gray-400"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 shrink-0" />
            Mesas
          </button>
          <button
            onClick={() => setTab("alerts")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "alerts"
                ? "bg-gray-600 text-white shadow-sm"
                : "text-gray-400"
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            Alertas
            {alerts > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shrink-0">
                {alerts}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-3 flex flex-col items-center gap-1">
          <p className="text-xl font-bold text-white">{sessions.length}</p>
          <p className="text-xs text-gray-500 text-center">Mesas ativas</p>
        </div>
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-3 flex flex-col items-center gap-1">
          <p className="text-xl font-bold text-green-400">
            {pendingDeliveries}
          </p>
          <p className="text-xs text-gray-500 text-center">Para entregar</p>
        </div>
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-3 flex flex-col items-center gap-1">
          <p className="text-xl font-bold text-purple-400">{alerts}</p>
          <p className="text-xs text-gray-500 text-center">Alertas</p>
        </div>
      </div>

      {/* Tab Mesas */}
      {tab === "tables" && (
        <div className="px-4 pb-8 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Suas Mesas
          </p>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          )}

          {!loading && sessions.length === 0 && (
            <div className="text-center py-16">
              <UtensilsCrossed className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhuma mesa ativa</p>
            </div>
          )}

          {sessions.map((session) => {
            const status = getSessionStatus(session);
            const config = tableStatusConfig[status];
            const readyOrders =
              session.orders?.filter((o) => o.status === "READY") || [];
            const isUnassigned = !session.waiterId;

            return (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
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
                        {isUnassigned
                          ? "Sem garçom — toque para aceitar"
                          : `Garçom: ${session.waiter?.name || "Você"}`}
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
                  <span className="text-xs text-gray-500">Total acumulado</span>
                  <span className="text-sm font-bold text-white">
                    R$ {getSessionTotal(session).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab Alertas */}
      {tab === "alerts" && (
        <div className="px-4 pb-8 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Alertas Ativos
          </p>

          {alerts === 0 && (
            <div className="text-center py-16">
              <CheckCheck className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhum alerta no momento</p>
            </div>
          )}

          {sessions
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
                <Button
                  size="sm"
                  icon={CheckCheck}
                  className="w-full mt-2"
                  onClick={() => setSelectedSession(session)}
                >
                  Ver mesa
                </Button>
              </div>
            ))}

          {sessions
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
                  Total — R$ {getSessionTotal(session).toFixed(2)}
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleCloseBill(session.id)}
                >
                  Fechar conta
                </Button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}