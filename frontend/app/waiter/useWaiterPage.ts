"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { sessionsService } from "@/services/sessions.service";
import { ordersService } from "@/services/orders.service";
import { useSocket } from "@/hooks/useSocket";
import { useNotifications } from "@/hooks/useNotifications";
import { TableSession } from "@/types";
import { toast } from "@/components/ui/Toast";

const RESTAURANT_FALLBACK = "f4385ae5-6187-40f8-97b4-d289d47dc441";

export type Tab = "tables" | "alerts";

export function useWaiterPage() {
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restaurantId = employee?.restaurantId || RESTAURANT_FALLBACK;

  const [sessions, setSessions] = useState<TableSession[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<TableSession | null>(null);
  const [tab, setTab] = useState<Tab>("tables");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [profileModalState, setProfileModalState] = useState<"closed" | "open" | "closing">("closed");
  const [showOpenTableModal, setShowOpenTableModal] = useState(false);

  function openProfileModal() {
    setProfileModalState("open");
  }

  function closeProfileModal() {
    setProfileModalState("closing");
    setTimeout(() => setProfileModalState("closed"), 300);
  }

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

  useEffect(() => {
    if (!selectedSession) return;
    const fresh = sessions.find((s) => s.id === selectedSession.id);
    if (fresh) setSelectedSession(fresh);
  }, [sessions]);

  useSocket(
    { type: "restaurant", id: restaurantId },
    {
      table_session_updated: () => {
        loadSessions();
      },
      new_order: () => {
        loadSessions();
        addNotification("new_order", "Novo Pedido", "Novo pedido recebido!");
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

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sessionsService.getActiveByRestaurant(restaurantId);
      setSessions(data);
    } catch {
      toast.error("Erro ao carregar mesas.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  async function handleAcceptTable(sessionId: string) {
    if (!employee) return;
    try {
      await sessionsService.assignWaiter(sessionId, employee.id);
      toast.success("Mesa aceita!");
      loadSessions();
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

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  async function handleOpenTable(tableId: string, guestName: string) {
    if (!employee) return;
    await sessionsService.open(
      tableId,
      restaurantId,
      undefined,
      guestName,
      employee.id,
    );
    loadSessions();
  }

  async function handleOrderPlaced() {
    await loadSessions();
    if (selectedSession) {
      try {
        const updated = await sessionsService.getOne(selectedSession.id);
        setSelectedSession(updated);
      } catch {
        // session might have been closed
      }
    }
  }

  function getSessionStatus(
    session: TableSession,
  ): "active" | "bill" | "call" {
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

  return {
    employee,
    restaurantId,
    sessions,
    selectedSession,
    tab,
    loading,
    mounted,
    notifications,
    unreadCount,
    soundEnabled,
    toggleSound,
    markAllRead,
    markRead,
    clearAll,
    typeConfig,
    pendingDeliveries,
    alerts,
    profileModalState,
    openProfileModal,
    closeProfileModal,
    showOpenTableModal,
    setShowOpenTableModal,
    setSelectedSession,
    setTab,
    handleAcceptTable,
    handleDeliverOrder,
    handleCloseBill,
    handleLogout,
    handleOpenTable,
    handleOrderPlaced,
    getSessionStatus,
    getSessionTotal,
  };
}
