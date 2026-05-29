"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

export interface AccessRequest {
  requestId: string;
  guestId: string;
  guestName: string;
  tableNumber: number;
}

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
  const [accessRequest, setAccessRequest] = useState<AccessRequest | null>(null);
  const sessionIdsRef = useRef(new Set<string>());
  const closingSessionIdRef = useRef<string | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sessionIdsRef.current = new Set(sessions.map((s) => s.id));
  }, [sessions]);

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
    if (fresh) {
      setSelectedSession(fresh);
    } else if (selectedSession.status !== "CLOSED") {
      // Se a sessão sumiu da lista e não foi fechada, pode ter sido arquivada
      setSelectedSession(null);
    }
  }, [sessions]);

  // Limpa timeout de redirecionamento ao desmontar
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  useSocket(
    { type: "restaurant", id: restaurantId },
    {
      table_session_updated: (data: any) => {
        if (data?.id && !data?.waiterId && !sessionIdsRef.current.has(data.id)) {
          const tableNumber = data?.table?.number || "?";
          addNotification(
            "new_order",
            "Nova Mesa",
            `Mesa ${tableNumber} aberta — sem garçom`,
            tableNumber,
          );
          toast(`Mesa ${tableNumber} foi aberta por um cliente!`, { icon: "🆕" });
        }
        if (data?.status === "CLOSED" && data.id !== closingSessionIdRef.current) {
          const tableNumber = data?.table?.number || "?";
          const reason = data?.closeReason;
          const role = data?.closedByRole;
          const message =
            reason === "AUTO_CLOSED"
              ? `Mesa ${tableNumber} encerrada pelo cliente`
              : reason === "PAYMENT_CLOSED"
                ? `Mesa ${tableNumber} encerrada — pagamento confirmado`
                : role === "MANAGER"
                  ? `Mesa ${tableNumber} encerrada pelo gestor`
                  : `Mesa ${tableNumber} foi encerrada`;
          addNotification("bill_requested", "Mesa Encerrada", message, tableNumber);
          toast(message, { icon: "🔒" });

          if (selectedSession?.id === data.id) {
            // Redireciona de forma delicada após a mensagem
            if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
            redirectTimeoutRef.current = setTimeout(() => {
              setSelectedSession(null);
            }, 2000);
          }
        }
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
      order_item_status_updated: () => {
        loadSessions();
      },
      waiter_called: (data: any) => {
        addNotification(
          "waiter_called",
          "Mesa Chamando",
          `Mesa ${data.tableNumber}: ${data.reason}`,
          data.tableNumber,
        );
        toast(`Mesa ${data.tableNumber}: ${data.reason}`, { icon: "🔔" });
        loadSessions();
      },
      bill_requested: (data: any) => {
        const tableNum = data?.table?.number ?? "?";
        // Garçom que solicitou a conta não deve ver a notificação
        if (data?.requestedBy && data.requestedBy === employee?.id) return;
        addNotification(
          "bill_requested",
          "Conta Solicitada",
          `Mesa ${tableNum} — cliente pedindo a conta`,
          data?.table?.number,
        );
        toast(`Mesa ${tableNum} — cliente pedindo a conta!`, { icon: "💳" });
        loadSessions();
      },
      table_access_requested: (data: any) => {
        if (data.ownerId !== employee?.id) return;
        setAccessRequest({
          requestId: data.requestId,
          guestId: data.guestId,
          guestName: data.guestName,
          tableNumber: data.tableNumber,
        });
        addNotification(
          "access_request",
          "Acesso à Mesa",
          `${data.guestName} quer entrar na Mesa ${data.tableNumber}`,
          data.tableNumber,
        );
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

  async function refreshSessionsSilent() {
    try {
      const data = await sessionsService.getActiveByRestaurant(restaurantId);
      setSessions(data);
    } catch {
      // silent — não mostra erro nem loading para não atrapalhar UX
    }
  }

  // ── Fallback ao voltar do standby / polling periódico ─────────────────
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshSessionsSilent();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = window.setInterval(refreshSessionsSilent, 30_000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [restaurantId]);

  async function handleAcceptTable(sessionId: string) {
    if (!employee) return;
    try {
      await sessionsService.assignWaiter(sessionId, employee.id);
      toast.success("Mesa aceita!");
      setSelectedSession(null);
      setTab("tables");
      loadSessions();
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
      closingSessionIdRef.current = sessionId;
      await sessionsService.close(sessionId);
      toast.success("Conta fechada! Mesa liberada.");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSelectedSession(null);
    } catch {
      toast.error("Erro ao fechar conta.");
    } finally {
      closingSessionIdRef.current = null;
    }
  }

  function handleLogout() {
    clearAll();
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

  async function handleRespondAccess(approved: boolean) {
    if (!accessRequest) return;
    try {
      await sessionsService.respondAccess(accessRequest.requestId, approved);
      const name = accessRequest.guestName;
      const table = accessRequest.tableNumber;
      setAccessRequest(null);
      if (approved) {
        toast.success(`${name} entrou na Mesa ${table}!`);
      } else {
        toast.error(`Acesso negado para ${name}.`);
      }
      loadSessions();
    } catch {
      toast.error("Erro ao responder solicitação.");
    }
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

  const mySessions = sessions.filter((s) => s.waiterId === employee?.id);
  const availableSessions = sessions.filter((s) => !s.waiterId);

  const pendingDeliveries = mySessions.reduce(
    (acc, s) =>
      acc + (s.orders?.filter((o) => o.status === "READY").length || 0),
    0,
  );

  const mySessionAlerts = mySessions.filter(
    (s) =>
      s.status === "REQUESTING_BILL" ||
      s.orders?.some((o) => o.status === "READY"),
  );

  const alerts = mySessionAlerts.length + availableSessions.length;

  return {
    employee,
    restaurantId,
    sessions,
    mySessions,
    availableSessions,
    mySessionAlerts,
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
    setProfileModalState,
    openProfileModal,
    closeProfileModal,
    showOpenTableModal,
    setShowOpenTableModal,
    accessRequest,
    setAccessRequest,
    handleRespondAccess,
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
