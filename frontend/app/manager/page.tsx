"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthStore } from "@/store/auth.store";
import {
  LayoutGrid,
  ClipboardList,
  Users,
  UtensilsCrossed,
  TrendingUp,
  Percent,
  Settings,
  ChefHat,
  Package,
  Loader2,
  LogOut,
} from "lucide-react";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/types";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useManagerDashboard } from "./useManagerDashboard";
import { SessionDetailModal } from "./modal/SessionDetailModal";
import { CloseConfirmModal } from "./modal/CloseConfirmModal";

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

export default function ManagerDashboard() {
  useRequireAuth("MANAGER");
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const {
    restaurantId,
    openSessions,
    todayOrders,
    loading,
    selectedSession,
    setSelectedSession,
    tables,
    getTableSession,
    cancelling,
    showCloseConfirm,
    setShowCloseConfirm,
    setClosingSessionId,
    handleCancelOrder,
    handleCloseClick,
    handleConfirmClose,
    getSessionStatus,
    getSessionTotal,
    getOrderElapsed,
    getSessionDuration,
    getGuestName,
    totalRevenue,
    activeOrders,
    totalServiceCharges,
    activeWaitersCount,
  } = useManagerDashboard();

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar items={navItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          <Header
            title=""
            subtitle="Visão geral do restaurante em tempo real"
            restaurantId={restaurantId}
          />

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
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
              title="Taxa de Serviço"
              value={`R$ ${totalServiceCharges.toFixed(2)}`}
              icon={Percent}
              color="yellow"
            />
            <MetricCard
              title="Garçons Ativos"
              value={activeWaitersCount}
              icon={Users}
              color="purple"
            />
          </div>

          <div className="flex flex-col xl:grid xl:grid-cols-3 gap-6">
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
                {tables.length === 0 && !loading && (
                  <p className="text-gray-500 text-sm text-center py-8">
                    Nenhuma mesa cadastrada
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-5 gap-3">
                  {[...tables]
                    .sort((a, b) => a.number - b.number)
                    .map((table) => {
                      const session = getTableSession(table.id);
                      const status = !session
                        ? "free"
                        : session.status === "REQUESTING_BILL"
                          ? "bill"
                          : "open";
                      const config = tableStatusConfig[status];
                      const total = session ? getSessionTotal(session) : 0;
                      return (
                        <div
                          key={table.id}
                          onClick={() => session && setSelectedSession(session)}
                          className={`rounded-2xl border-2 p-3 flex flex-col min-h-[155px] ${session ? "cursor-pointer hover:brightness-110" : ""} transition-all duration-150 ${config.bg} ${config.border}`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-gray-100">
                              Mesa {table.number}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                          </div>
                          <p className={`text-xs font-medium ${config.text}`}>
                            {config.label}
                          </p>
                          {(session?.guestLabel || (session?.guests && session.guests.length > 0)) && (
                            <p className="text-xs font-medium text-gray-200 truncate">
                              Cliente: {session.guests?.[0]?.name?.split(" ")[0] ??
                                session.guests?.[0]?.email ??
                                session.guestLabel ??
                                "—"}
                            </p>
                          )}
                          {session && (
                            <>
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                Garçom: {session.waiter?.name || "Sem garçom"}
                              </p>
                              <p className="text-xs font-semibold text-gray-200 mt-1">
                                R$ {total.toFixed(2)}
                              </p>
                            </>
                          )}
                          {!session && <div className="flex-1" />}
                        </div>
                      );
                    })}
                </div>
              </Card>
            </div>

            <div className="xl:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Pedidos Recentes</CardTitle>
                  <span className="text-xs text-gray-400">Tempo real</span>
                </CardHeader>

                {todayOrders.length === 0 && !loading && (
                  <p className="text-gray-500 text-sm text-center py-8">
                    Nenhum pedido hoje
                  </p>
                )}

                <div className="space-y-2">
                  {todayOrders.slice(0, 8).map((order) => (
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
                            {order.items.map((i) => i.menuItem?.name).join(", ")}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {order.session?.waiter?.name || "Sem garçom"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs text-gray-500">
                          {getOrderElapsed(order)}
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

      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          getSessionStatus={getSessionStatus}
          getSessionTotal={getSessionTotal}
          getOrderElapsed={getOrderElapsed}
          getSessionDuration={getSessionDuration}
          getGuestName={getGuestName}
          handleCancelOrder={handleCancelOrder}
          handleCloseClick={handleCloseClick}
          cancelling={cancelling}
        />
      )}

      {showCloseConfirm && (
        <CloseConfirmModal
          onCancel={() => {
            setShowCloseConfirm(false);
            setClosingSessionId(null);
          }}
          onConfirm={handleConfirmClose}
        />
      )}
    </div>
  );
}
