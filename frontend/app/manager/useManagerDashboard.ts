"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { sessionsService } from "@/services/sessions.service";
import { ordersService } from "@/services/orders.service";
import { useSocket } from "@/hooks/useSocket";
import { useAppModal } from "@/context/AppModalContext";
import { TableSession, Order, Employee, Guest, Table } from "@/types";
import { RESTAURANT_ID_FALLBACK } from "@/constants";

export type DashboardSession = TableSession & {
  guests?: Guest[];
};

export function useManagerDashboard() {
  const { employee } = useAuthStore();
  const { showModal } = useAppModal();
  const restaurantId =
    employee?.restaurantId || RESTAURANT_ID_FALLBACK;

  const [sessions, setSessions] = useState<DashboardSession[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalServiceCharges, setTotalServiceCharges] = useState(0);
  const [activeWaitersCount, setActiveWaitersCount] = useState(0);
  const [selectedSession, setSelectedSession] =
    useState<DashboardSession | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closingSessionId, setClosingSessionId] = useState<string | null>(null);

  const loadData = useCallback(
    async (showSpinner = true) => {
      try {
        if (showSpinner) setLoading(true);
        const [sessionsResponse, ordersResponse, reportResponse, tablesResponse] =
          await Promise.all([
            sessionsService.getActiveByRestaurant(restaurantId),
            ordersService.getByRestaurant(restaurantId),
            api.get(`/payments/restaurant/${restaurantId}/report`),
            api.get(`/tables/restaurant/${restaurantId}`),
          ]);
        const sessionsData = sessionsResponse as DashboardSession[];
        const ordersData = ordersResponse as Order[];
        setSessions(sessionsData);
        setRecentOrders(ordersData);
        setTables(tablesResponse.data as Table[]);
        setTotalServiceCharges(reportResponse.data?.totalServiceCharges ?? 0);
        const waiters = sessionsData
          .map((s) => s.waiter)
          .filter((waiter): waiter is Employee => Boolean(waiter))
          .filter(
            (waiter, index, arr) =>
              arr.findIndex((item) => item.id === waiter.id) === index,
          );
        setEmployees(waiters);
        setActiveWaitersCount((prev) => prev || waiters.length);
        setSelectedSession((current) => {
          if (!current) return current;
          return (
            sessionsData.find((session) => session.id === current.id) ?? null
          );
        });
      } catch {
        showModal({
          title: "Dashboard indisponível",
          message: "Não foi possível carregar os dados do painel.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [restaurantId, showModal],
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
      active_waiters_updated: (count: number) =>
        setActiveWaitersCount(count),
    },
  );

  async function handleCancelOrder(orderId: string) {
    if (!confirm("Deseja cancelar este pedido?")) return;
    setCancelling(orderId);
    try {
      await ordersService.cancel(orderId);
      await loadData();
    } catch {
      showModal({
        title: "Pedido não cancelado",
        message: "Não foi possível cancelar este pedido.",
        variant: "error",
      });
    } finally {
      setCancelling(null);
    }
  }

  function handleCloseClick(sessionId: string) {
    setClosingSessionId(sessionId);
    setShowCloseConfirm(true);
  }

  async function handleConfirmClose() {
    if (!closingSessionId) return;
    setShowCloseConfirm(false);
    try {
      await sessionsService.close(closingSessionId);
      setSelectedSession(null);
      setClosingSessionId(null);
      await loadData();
    } catch {
      showModal({
        title: "Mesa não encerrada",
        message: "Não foi possível encerrar esta mesa.",
        variant: "error",
      });
    }
  }

  function getTableSession(tableId: string) {
    return sessions.find((s) => s.tableId === tableId && s.status !== "CLOSED") ?? null;
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

  function getOrderElapsed(order: Order): string {
    const start = new Date(order.createdAt).getTime();
    const isFinal =
      order.status === "DELIVERED" || order.status === "CANCELLED";
    if (isFinal && order.statusHistory && order.statusHistory.length > 0) {
      const lastEntry = [...order.statusHistory]
        .filter((h) => h.status === order.status)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
      if (lastEntry) {
        const minutes = Math.floor(
          (new Date(lastEntry.createdAt).getTime() - start) / 60000,
        );
        return `${minutes} min ✓`;
      }
    }
    const minutes = Math.floor((Date.now() - start) / 60000);
    return `${minutes} min`;
  }

  function getSessionDuration(date: string): string {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  }

  function getGuestName(session: DashboardSession | null): string | null {
    const guest = session?.guests?.[0];
    if (guest) return guest.name?.trim() || guest.email || null;
    if (session?.guestLabel) return session.guestLabel;
    return null;
  }

  const openSessions = sessions.filter((s) => s.status !== "CLOSED");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  const todayOrders = recentOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= todayStart && d <= todayEnd;
  });

  const totalRevenue = todayOrders
    .filter((o) => o.status !== "CANCELLED")
    .reduce(
      (acc, o) => acc + o.items.reduce((s, i) => s + i.price * i.quantity, 0),
      0,
    );

  const activeOrders = todayOrders.filter(
    (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
  );

  return {
    restaurantId,
    sessions,
    tables,
    openSessions,
    todayOrders,
    employees,
    totalServiceCharges,
    activeWaitersCount,
    getTableSession,
    loading,
    selectedSession,
    setSelectedSession,
    cancelling,
    showCloseConfirm,
    setShowCloseConfirm,
    closingSessionId,
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
  };
}
