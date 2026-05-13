"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth.store";
import { sessionsService } from "@/services/sessions.service";
import { ordersService } from "@/services/orders.service";
import { useSocket } from "@/hooks/useSocket";
import {
  LayoutGrid,
  ClipboardList,
  Users,
  UtensilsCrossed,
  TrendingUp,
  Settings,
  ChefHat,
  Package,
  Loader2,
  X,
  UserCheck,
  Clock,
  DollarSign,
  AlertCircle,
  Bell,
  LogOut,
} from "lucide-react";
import {
  TableSession,
  Order,
  Employee,
  Guest,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "@/types";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/manager", icon: LayoutGrid, label: "Dashboard" },
  { href: "/manager/tables", icon: UtensilsCrossed, label: "Mesas" },
  { href: "/manager/orders", icon: ClipboardList, label: "Pedidos" },
  { href: "/manager/menu", icon: ChefHat, label: "Cardápio" },
  { href: "/manager/employees", icon: Users, label: "Equipe" },
  { href: "/manager/stock", icon: Package, label: "Estoque" },
  { href: "/manager/reports", icon: TrendingUp, label: "Relatórios" },
  { href: "/manager/settings", icon: Settings, label: "Configurações" },
];

const tableStatusConfig = {
  free: {
    label: "Livre",
    bg: "bg-gray-800",
    border: "border-gray-600",
    dot: "bg-gray-500",
    text: "text-gray-500",
  },
  open: {
    label: "Ocupada",
    bg: "bg-green-900/30",
    border: "border-green-700",
    dot: "bg-green-400",
    text: "text-green-400",
  },
  bill: {
    label: "Conta",
    bg: "bg-orange-900/30",
    border: "border-orange-700",
    dot: "bg-orange-400",
    text: "text-orange-400",
  },
};

type DashboardSession = TableSession & {
  guests?: Guest[];
};

export default function ManagerDashboard() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [sessions, setSessions] = useState<DashboardSession[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] =
    useState<DashboardSession | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const loadData = useCallback(
    async (showSpinner = true) => {
      try {
        if (showSpinner) setLoading(true);
        const [sessionsResponse, ordersResponse] = await Promise.all([
          sessionsService.getActiveByRestaurant(restaurantId),
          ordersService.getByRestaurant(restaurantId),
        ]);
        const sessionsData = sessionsResponse as DashboardSession[];
        const ordersData = ordersResponse as Order[];
        setSessions(sessionsData);
        setRecentOrders(ordersData.slice(0, 8));
        const waiters = sessionsData
          .map((s) => s.waiter)
          .filter((waiter): waiter is Employee => Boolean(waiter))
          .filter(
            (waiter, index, arr) =>
              arr.findIndex((item) => item.id === waiter.id) === index,
          );
        setEmployees(waiters);
        setSelectedSession((current) => {
          if (!current) return current;
          return (
            sessionsData.find((session) => session.id === current.id) ?? null
          );
        });
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    },
    [restaurantId],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useSocket(
    { type: "restaurant", id: restaurantId },
    {
      table_session_updated: () => loadData(false),
      new_order: () => loadData(false),
      order_status_updated: () => loadData(false),
      bill_requested: () => loadData(false),
    },
  );

  async function handleCancelOrder(orderId: string) {
    if (!confirm("Deseja cancelar este pedido?")) return;
    setCancelling(orderId);
    try {
      await ordersService.cancel(orderId);
      await loadData();
    } catch {
      console.error("Erro ao cancelar pedido");
    } finally {
      setCancelling(null);
    }
  }

  async function handleCloseSession(sessionId: string) {
    if (!confirm("Deseja encerrar esta mesa?")) return;
    try {
      await sessionsService.close(sessionId);
      setSelectedSession(null);
      await loadData();
    } catch {
      console.error("Erro ao encerrar mesa");
    }
  }

  function getSessionStatus(session: TableSession): "free" | "open" | "bill" {
    if (session.status === "REQUESTING_BILL") return "bill";
    return "open";
  }

  function getSessionTotal(session: TableSession): number {
    return (
      session.orders?.reduce((acc, o) => {
        if (o.status === "CANCELLED") return acc;
        return acc + o.items.reduce((s, i) => s + i.price * i.quantity, 0);
      }, 0) || 0
    );
  }

  function getElapsedMinutes(date: string): string {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    return `${minutes} min`;
  }

  function getSessionDuration(date: string): string {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  }

  function getGuestName(session: DashboardSession | null): string | null {
    const guest = session?.guests?.[0];

    if (!guest) return null;

    return guest.name?.trim() || guest.email || null;
  }

  const openSessions = sessions.filter((s) => s.status !== "CLOSED");
  const totalRevenue = openSessions.reduce(
    (acc, s) => acc + getSessionTotal(s),
    0,
  );
  const activeOrders = recentOrders.filter(
    (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
  );

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar items={navItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-6 gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Ol&aacute;, {employee?.name?.split(" ")[0] || "Gestor"}!
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Vis&atilde;o geral do restaurante em tempo real
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-700 transition-all">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-orange-500 rounded-full" />
              </button>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                <span className="text-white font-semibold text-xs sm:text-sm">
                  {employee?.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "DG"}
                </span>
              </div>
              <button
                onClick={() => {
                  clearAuth();
                  router.push("/login");
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          )}

          {/* Métricas — 1 coluna no mobile, 2 no tablet, 4 no desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
            <MetricCard
              title="Mesas Abertas"
              value={openSessions.length}
              icon={UtensilsCrossed}
              color="orange"
            />
            <MetricCard
              title="Pedidos Ativos"
              value={activeOrders.length}
              icon={ClipboardList}
              color="blue"
            />
            <MetricCard
              title="Faturamento Hoje"
              value={`R$ ${totalRevenue.toFixed(2)}`}
              icon={TrendingUp}
              color="green"
            />
            <MetricCard
              title="Garçons Ativos"
              value={employees.length}
              icon={Users}
              color="purple"
            />
          </div>

          {/* Conteúdo — empilhado no mobile, lado a lado no desktop */}
          <div className="flex flex-col xl:grid xl:grid-cols-3 gap-6">
            {/* Mapa de Mesas */}
            <div className="xl:col-span-2">
              <Card>
                <CardHeader className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle>Mapa de Mesas</CardTitle>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-500" />
                      Livre
                    </span>

                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      Ocupada
                    </span>

                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      Conta
                    </span>
                  </div>
                </CardHeader>
                {openSessions.length === 0 && !loading && (
                  <p className="text-gray-500 text-sm text-center py-8">
                    Nenhuma mesa ativa no momento
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-5 gap-3">
                  {openSessions.map((session) => {
                    const status = getSessionStatus(session);
                    const config = tableStatusConfig[status];
                    const total = getSessionTotal(session);
                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`rounded-2xl border-2 p-3 cursor-pointer hover:brightness-110 transition-all duration-150 ${config.bg} ${config.border}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-gray-100">
                            Mesa {session.table?.number}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${config.dot}`}
                          />
                        </div>
                        <p className={`text-xs font-medium ${config.text}`}>
                          {config.label}
                        </p>
                        {/* Nome do cliente — só exibe quando a mesa está ocupada */}
                        {session.guests && session.guests.length > 0 && (
                          <p className="text-xs font-medium text-gray-200 truncate">
                            {session.guests[0].name?.split(" ")[0] ??
                              session.guests[0].email}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {session.waiter?.name || "Sem garçom"}
                        </p>
                        <p className="text-xs font-semibold text-gray-200 mt-1">
                          R$ {total.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Pedidos Recentes */}
            <div className="xl:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Pedidos Recentes</CardTitle>
                  <span className="text-xs text-gray-400">Tempo real</span>
                </CardHeader>

                {recentOrders.length === 0 && !loading && (
                  <p className="text-gray-500 text-sm text-center py-8">
                    Nenhum pedido ainda
                  </p>
                )}

                <div className="space-y-2">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-start justify-between p-3 rounded-xl bg-gray-800 gap-2"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-orange-400">
                            {order.session?.table?.number ?? "?"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-100 truncate">
                            {order.items
                              .map((i) => i.menuItem?.name)
                              .join(", ")}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {order.session?.waiter?.name || "Sem garçom"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs text-gray-500">
                          {getElapsedMinutes(order.createdAt)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${ORDER_STATUS_COLOR[order.status]}`}
                        >
                          {ORDER_STATUS_LABEL[order.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes da Mesa */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedSession(null)}
          />
          <div className="relative bg-gray-800 rounded-t-3xl sm:rounded-2xl border border-gray-700 w-full sm:max-w-2xl mx-0 sm:mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <span className="text-orange-400 font-bold">
                    {selectedSession.table?.number}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    Mesa {selectedSession.table?.number}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {getSessionStatus(selectedSession) === "bill"
                      ? "⚠️ Pedindo conta"
                      : "● Sessão ativa"}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedSession(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 p-4 border-b border-gray-700">
              <div className="bg-gray-700/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-orange-400" />
                  <p className="text-xs text-gray-400">Cliente</p>
                </div>
                <p className="text-sm font-semibold text-white truncate">
                  {getGuestName(selectedSession)?.split(" ")[0] || "—"}
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-xs text-gray-400">Garçom</p>
                </div>
                <p className="text-sm font-semibold text-white truncate">
                  {selectedSession.waiter?.name || "Nenhum"}
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <p className="text-xs text-gray-400">Tempo</p>
                </div>
                <p className="text-sm font-semibold text-white">
                  {getSessionDuration(selectedSession.openedAt)}
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-green-400" />
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <p className="text-sm font-bold text-green-400">
                  R$ {getSessionTotal(selectedSession).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Pedidos ({selectedSession.orders?.length || 0})
              </p>

              {(!selectedSession.orders ||
                selectedSession.orders.length === 0) && (
                <p className="text-gray-500 text-sm text-center py-8">
                  Nenhum pedido ainda
                </p>
              )}

              <div className="space-y-3">
                {selectedSession.orders
                  ?.slice()
                  .sort((a, b) => {
                    const order = [
                      "WAITING",
                      "PREPARING",
                      "READY",
                      "ON_THE_WAY",
                      "DELIVERED",
                      "CANCELLED",
                    ];
                    return order.indexOf(a.status) - order.indexOf(b.status);
                  })
                  .map((order) => (
                    <div
                      key={order.id}
                      className="bg-gray-700/50 rounded-xl p-3 border border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <StatusBadge status={order.status} />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {getElapsedMinutes(order.createdAt)}
                          </span>
                          <span className="text-sm font-bold text-white">
                            R${" "}
                            {order.items
                              .reduce((acc, i) => acc + i.price * i.quantity, 0)
                              .toFixed(2)}
                          </span>
                          {order.status !== "CANCELLED" &&
                            order.status !== "DELIVERED" && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={cancelling === order.id}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs disabled:opacity-50"
                              >
                                {cancelling === order.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <AlertCircle className="w-3 h-3" />
                                )}
                                Cancelar
                              </button>
                            )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
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
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-700 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total acumulado</p>
                <p className="text-xl font-bold text-green-400">
                  R$ {getSessionTotal(selectedSession).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="bg-gray-700 border-gray-600 text-gray-300"
                  onClick={() => setSelectedSession(null)}
                >
                  Fechar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleCloseSession(selectedSession.id)}
                >
                  Encerrar Mesa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
