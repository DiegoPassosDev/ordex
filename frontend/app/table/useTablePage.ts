"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { menuService } from "@/services/menu.service";
import { ordersService } from "@/services/orders.service";
import { sessionsService } from "@/services/sessions.service";
import { api } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { useTableAccessAlerts } from "@/hooks/useTableAccessAlerts";
import { Category, Order } from "@/types";
import { toast } from "@/components/ui/Toast";
import { useAppModal } from "@/context/AppModalContext";

export type Tab = "menu" | "orders";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface OrderNotification {
  id: string;
  message: string;
  read: boolean;
}

export function useTablePage() {
  const router = useRouter();
  const { showModal } = useAppModal();
  const {
    accessAlertsEnabled,
    accessAlertsPermission,
    enableAccessAlerts,
    notifyAccessRequest,
  } = useTableAccessAlerts();
  const searchParams = useSearchParams();
  const tableIdFromUrl = searchParams.get("tableId");

  const {
    guest,
    restaurantId,
    sessionId,
    tableId: tableIdFromStore,
    tableNumber,
    setSessionId,
    setTableId,
    setTableNumber,
    logout,
  } = useAuthStore();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("menu");
  const [showCart, setShowCart] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // ── Data state ────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [serviceCharge, setServiceCharge] = useState(10);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [orderNotifications, setOrderNotifications] = useState<
    OrderNotification[]
  >([]);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  // ── Acesso à mesa ─────────────────────────────────────────────────────────
  const [waitingForAccess, setWaitingForAccess] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<{
    requestId: string;
    guestId: string;
    guestName: string;
  } | null>(null);

  // ── Loading state ─────────────────────────────────────────────────────────
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [identifyingTable, setIdentifyingTable] = useState(false);

  // ── Bill / conta ──────────────────────────────────────────────────────────
  const [showBillModal, setShowBillModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [acceptService, setAcceptService] = useState(true);
  const [requestingBill, setRequestingBill] = useState(false);
  const [billRequested, setBillRequested] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const notifRef = useRef<HTMLDivElement>(null);
  const identifyingRef = useRef(false);

  // ── Derived values ────────────────────────────────────────────────────────
  const TABLE_ID = tableIdFromUrl || tableIdFromStore;
  const hasTable = !!TABLE_ID;
  const RESTAURANT_ID = restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";
  const cartTotal = cart.reduce((acc, c) => acc + c.price * c.quantity, 0);
  const cartCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const activeOrders = orders.filter(
    (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
  );
  const unreadNotifCount = orderNotifications.filter((n) => !n.read).length;

  // ── Fecha dropdown de notificações ao clicar fora ─────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Carrega pedidos da sessão ─────────────────────────────────────────────
  const loadOrders = useCallback(
    async (sid = sessionId) => {
      if (!sid) return;
      try {
        const data = await ordersService.getBySession(sid);
        setOrders(data);
      } catch {
        showModal({
          title: "Pedidos indisponíveis",
          message: "Não foi possível carregar seus pedidos agora.",
          variant: "error",
        });
      }
    },
    [sessionId, showModal],
  );

  // ── Carrega cardápio e dados do restaurante ───────────────────────────────
  const loadMenu = useCallback(async (rid: string) => {
    try {
      setLoadingMenu(true);
      const [menuData, restaurantData] = await Promise.all([
        menuService.getCategoriesByRestaurant(rid),
        api.get(`/restaurants/${rid}`).then((r) => r.data),
      ]);
      setCategories(menuData);
      setRestaurantName(restaurantData.name ?? null);
      setServiceCharge(restaurantData.serviceCharge ?? 10);
      if (menuData.length > 0) setActiveCategory(menuData[0].id);
    } catch {
      toast.error("Erro ao carregar o cardápio.");
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  // ── Identifica mesa e gerencia acesso ─────────────────────────────────────
  const identifyTable = useCallback(
    async (id: string, showSuccess = false) => {
      if (identifyingRef.current) return;
      identifyingRef.current = true;
      try {
        setIdentifyingTable(true);

        // ✅ Lê o guestId direto do store, garantindo o valor atual
        const currentGuestId = useAuthStore.getState().guest?.id;

        const table = await sessionsService.getTable(id);
        setTableId(table.id, table.restaurantId);
        setTableNumber(String(table.number));

        const existingSession = await sessionsService.getActiveSession(
          table.id,
        );

        if (existingSession) {
          const alreadyIn = existingSession.guests?.some(
            (g: any) => g.id === currentGuestId, // ← usa o valor garantido
          );

          if (alreadyIn) {
            // Já está na sessão — entra normalmente
            setSessionId(existingSession.id);
            await Promise.all([
              loadMenu(table.restaurantId),
              loadOrders(existingSession.id),
            ]);
            if (showSuccess) {
              setScanning(false);
              setConfirmed(true);
              setTimeout(() => setConfirmed(false), 2000);
            }
          } else {
            // Não está — pede autorização
            const ownerGuest = existingSession.guests?.[0];
            setOwnerName(ownerGuest?.name?.split(" ")[0] || "o responsável");
            setPendingSessionId(existingSession.id);

            await sessionsService.requestAccess(
              existingSession.id,
              currentGuestId!,
            );
            setWaitingForAccess(true);
            await loadMenu(table.restaurantId);
          }
        } else {
          const session = await sessionsService.open(
            table.id,
            table.restaurantId,
            currentGuestId,
          );
          setSessionId(session.id);
          await Promise.all([
            loadMenu(table.restaurantId),
            loadOrders(session.id),
          ]);
          if (showSuccess) {
            setScanning(false);
            setConfirmed(true);
            setTimeout(() => setConfirmed(false), 2000);
          }
        }
      } catch {
        showModal({
          title: "Mesa não identificada",
          message:
            "Não foi possível validar esta mesa. Tente ler o QR Code novamente.",
          variant: "error",
        });
        toast.error("Não foi possível identificar a mesa.");
      } finally {
        setIdentifyingTable(false);
        identifyingRef.current = false;
      }
    },
    [loadMenu, loadOrders, setSessionId, setTableId, setTableNumber, showModal], // ← removido guest?.id das deps
  );
  // ── Bootstrap — roda uma vez após montar ─────────────────────────────────
  useEffect(() => {
    if (!hasHydrated) return;

    const urlTableId = new URLSearchParams(window.location.search).get(
      "tableId",
    );

    const storeState = useAuthStore.getState();

    const storeTableId = storeState.tableId;
    const storeRestaurantId = storeState.restaurantId;
    const storeSessionId = storeState.sessionId;

    const effectiveTableId = urlTableId || storeTableId;

    // ✅ Já possui sessão salva → apenas recarrega dados
    if (storeSessionId && storeRestaurantId) {
      loadMenu(storeRestaurantId);
      loadOrders(storeSessionId);
      return;
    }

    // ✅ Não possui sessão → identifica mesa novamente
    if (effectiveTableId) {
      const currentGuest = useAuthStore.getState().guest;

      if (!currentGuest?.id) {
        // Não está logado — redireciona para login de cliente
        // preservando o tableId na URL para entrar direto após o login
        router.push(`/login/customer?tableId=${effectiveTableId}`);
        return;
      }

      if (!waitingForAccess && !pendingSessionId) {
        identifyTable(effectiveTableId);
      }
    }
  }, [hasHydrated, guest?.id, waitingForAccess, pendingSessionId]);

  // ── Polling ao voltar ao foco — verifica solicitações pendentes ───────────
  useEffect(() => {
    async function checkPendingRequests() {
      if (!sessionId || waitingForAccess) return;

      try {
        const pending =
          await sessionsService.getPendingAccessRequests(sessionId);
        if (pending && pending.length > 0) {
          const req = pending[0];
          if (req.ownerId === guest?.id) {
            // Se já está visível na tela, não duplica notificação
            if (incomingRequest?.requestId === req.id) return;

            notifyAccessRequest(req.guest.name, undefined);
            setIncomingRequest({
              requestId: req.id,
              guestId: req.guestId,
              guestName: req.guest.name,
            });
          }
        }
      } catch {
        // silencioso
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkPendingRequests();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Polling periódico como fallback (a cada 30s)
    const interval = window.setInterval(checkPendingRequests, 30_000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [sessionId, guest?.id, waitingForAccess, incomingRequest?.requestId]);

  // ── WebSocket — atualizações em tempo real ────────────────────────────────
  useSocket(
    sessionId || pendingSessionId
      ? { type: "session", id: (sessionId || pendingSessionId)! }
      : null,
    {
      order_status_updated: (order: any) => {
        loadOrders();
        const statusMessages: Record<string, string> = {
          PREPARING: "🍳 Seu pedido entrou em preparo!",
          READY: "✅ Seu pedido está pronto!",
          ON_THE_WAY: "🚶 Seu pedido está a caminho!",
          DELIVERED: "🎉 Pedido entregue. Bom apetite!",
          CANCELLED: "❌ Um pedido foi cancelado.",
        };
        const msg = statusMessages[order?.status];
        if (msg) {
          setOrderNotifications((prev) =>
            [{ id: `${Date.now()}`, message: msg, read: false }, ...prev].slice(
              0,
              10,
            ),
          );
        }
      },
      new_order: () => loadOrders(),
      bill_requested: () => {
        setBillRequested(true);
      },

      // Dono recebe solicitação de acesso de outro guest
      table_access_requested: (data: any) => {
        if (data.ownerId !== guest?.id) return; // ← LINHA NOVA
        void notifyAccessRequest(data.guestName, data.tableNumber);
        setIncomingRequest({
          requestId: data.requestId,
          guestId: data.guestId,
          guestName: data.guestName,
        });
      },

      // Solicitante recebe a resposta do dono
      table_access_response: async (data: any) => {
        if (data.guestId !== guest?.id) return;
        if (data.approved) {
          // ✅ Só agora salva o sessionId de verdade no store
          if (pendingSessionId) {
            setSessionId(pendingSessionId); // ← salva no store só após aprovação
            setPendingSessionId(null); // ← limpa o temporário
            await loadOrders(pendingSessionId);
          }
          const currentRestaurantId = useAuthStore.getState().restaurantId;
          if (currentRestaurantId) {
            await loadMenu(currentRestaurantId);
          }
          setWaitingForAccess(false);
          setConfirmed(true);
          setTimeout(() => setConfirmed(false), 2000);
          toast.success("Acesso autorizado! Bem-vindo à mesa.");
        } else {
          setWaitingForAccess(false);
          setPendingSessionId(null); // ← limpa também se negado
          setAccessDenied(true);
        }
      },
    },
  );

  // ── Ações ─────────────────────────────────────────────────────────────────
  function handleQrScan(scannedTableId: string) {
    identifyTable(scannedTableId, true);
  }

  function addToCart(item: { id: string; name: string; price: number }) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing)
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} adicionado!`, { duration: 2000 });
  }

  function removeFromCart(id: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing && existing.quantity > 1)
        return prev.map((c) =>
          c.id === id ? { ...c, quantity: c.quantity - 1 } : c,
        );
      return prev.filter((c) => c.id !== id);
    });
    toast.error(`${cart.find((c) => c.id === id)?.name} removido!`, {
      duration: 2000,
    });
  }

  function updateNotes(id: string, notes: string) {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, notes } : c)));
  }

  async function confirmOrder() {
    if (cart.length === 0) return;
    if (!guest) {
      toast.error("Você precisa estar logado.");
      return;
    }
    if (!TABLE_ID) {
      toast.error("Escaneie o QR Code da mesa primeiro.");
      return;
    }

    setLoadingOrder(true);
    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await sessionsService.open(
          TABLE_ID,
          RESTAURANT_ID,
          guest.id,
        );
        currentSessionId = session.id;
        setSessionId(session.id);
      }
      await ordersService.create(
        currentSessionId!,
        guest.id || "",
        cart.map((c) => ({
          menuItemId: c.id,
          quantity: c.quantity,
          notes: c.notes || undefined,
        })),
      );
      setCart([]);
      setShowCart(false);
      toast.success("Pedido confirmado!");
      setTab("orders");
      await loadOrders();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Erro ao confirmar pedido.";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoadingOrder(false);
    }
  }

  async function handleCallWaiter() {
    if (!sessionId) {
      toast.error("Faça um pedido primeiro.");
      return;
    }
    try {
      await sessionsService.callWaiter(sessionId, "Preciso de ajuda");
      toast.success("Garçom chamado!");
    } catch {
      toast.error("Erro ao chamar o garçom.");
    }
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      if (sessionId && guest?.id) {
        const session = await sessionsService.getOne(sessionId);
        if (session.status !== "CLOSED") {
          // ✅ Apenas sai da sessão, não fecha para todos
          await sessionsService.leaveSession(sessionId, guest.id);
        }
      }
    } catch {
    } finally {
      setLoggingOut(false);
    }
    logout();
    router.push("/login/customer");
  }

  function handleToggleNotifications() {
    setShowNotifications((v) => !v);
    if (!showNotifications) {
      setOrderNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  function clearNotifications() {
    setOrderNotifications([]);
  }

  async function handleRequestBill() {
    if (!sessionId) return;
    setRequestingBill(true);
    try {
      await sessionsService.requestBill(sessionId, {
        preferredPaymentMethod: paymentMethod,
        serviceChargeAccepted: acceptService,
      });
      setBillRequested(true);
      setShowBillModal(false);
      toast.success("Conta solicitada! O garçom virá em breve.");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao solicitar a conta.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setRequestingBill(false);
    }
  }

  async function handleRespondAccess(approved: boolean) {
    if (!incomingRequest || !guest?.id) return;
    try {
      await sessionsService.respondAccess(
        incomingRequest.requestId,
        approved,
      );
      setIncomingRequest(null);
      if (approved) {
        toast.success(`${incomingRequest.guestName} entrou na mesa!`);
      } else {
        toast.error(`Acesso negado para ${incomingRequest.guestName}.`);
      }
    } catch {
      toast.error("Erro ao responder solicitação.");
    }
  }

  // ── Retorno ───────────────────────────────────────────────────────────────
  return {
    // Auth / sessão
    guest,
    sessionId,
    TABLE_ID,
    tableNumber,
    hasTable,

    // UI toggles
    tab,
    setTab,
    showCart,
    setShowCart,
    showLogoutModal,
    setShowLogoutModal,
    showProfileModal,
    setShowProfileModal,
    scanning,
    setScanning,
    confirmed,
    showNotifications,
    hasHydrated,
    accessAlertsEnabled,
    accessAlertsPermission,

    // Dados
    cart,
    categories,
    restaurantName,
    serviceCharge,
    orders,
    activeCategory,
    setActiveCategory,
    orderNotifications,

    // Derivados
    cartTotal,
    cartCount,
    activeOrders,
    unreadNotifCount,

    // Loading
    loadingMenu,
    loadingOrder,
    identifyingTable,
    loggingOut,

    // Refs
    notifRef,

    // Acesso à mesa
    waitingForAccess,
    accessDenied,
    setAccessDenied,
    ownerName,
    incomingRequest,
    handleRespondAccess,

    // Ações
    handleQrScan,
    addToCart,
    removeFromCart,
    updateNotes,
    confirmOrder,
    handleCallWaiter,
    handleLogout,
    handleToggleNotifications,
    clearNotifications,
    loadOrders,
    handleRequestBill,
    enableAccessAlerts,

    // Bill / conta
    showBillModal,
    setShowBillModal,
    paymentMethod,
    setPaymentMethod,
    acceptService,
    setAcceptService,
    requestingBill,
    billRequested,
  };
}
