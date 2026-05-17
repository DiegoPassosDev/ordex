"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { menuService } from "@/services/menu.service";
import { ordersService } from "@/services/orders.service";
import { sessionsService } from "@/services/sessions.service";
import { api } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { Category, Order } from "@/types";
import { toast } from "@/components/ui/Toast";

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

  // ── Loading state ─────────────────────────────────────────────────────────
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [identifyingTable, setIdentifyingTable] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [acceptService, setAcceptService] = useState(true);
  const [requestingBill, setRequestingBill] = useState(false);
  const [billRequested, setBillRequested] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const notifRef = useRef<HTMLDivElement>(null);

  // ── Derived values ────────────────────────────────────────────────────────
  const TABLE_ID = tableIdFromUrl || tableIdFromStore;
  const hasTable = !!TABLE_ID && !!tableNumber;
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
        console.error("Erro ao carregar pedidos");
      }
    },
    [sessionId],
  );

  // ── Carrega cardápio e nome do restaurante ────────────────────────────────
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

  // ── Identifica mesa pelo id (QR ou store) ─────────────────────────────────
  const identifyTable = useCallback(
    async (id: string, showSuccess = false) => {
      try {
        setIdentifyingTable(true);
        const table = await sessionsService.getTable(id);
        setTableId(table.id, table.restaurantId);
        setTableNumber(String(table.number));
        const session = await sessionsService.open(
          table.id,
          table.restaurantId,
          guest?.id,
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
      } catch {
        toast.error("Não foi possível identificar a mesa.");
      } finally {
        setIdentifyingTable(false);
      }
    },
    [guest?.id, loadMenu, loadOrders, setSessionId, setTableId, setTableNumber],
  );

  // ── Bootstrap — roda uma vez após montar ─────────────────────────────────
  useEffect(() => {
    const urlTableId = new URLSearchParams(window.location.search).get(
      "tableId",
    );
    const storeTableId = useAuthStore.getState().tableId;
    const storeRestaurantId = useAuthStore.getState().restaurantId;
    const storeSessionId = useAuthStore.getState().sessionId;

    const effectiveTableId = urlTableId || storeTableId;

    if (effectiveTableId) {
      identifyTable(effectiveTableId);
    } else if (storeRestaurantId && storeSessionId) {
      loadMenu(storeRestaurantId);
      loadOrders(storeSessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── WebSocket — atualizações em tempo real ────────────────────────────────
  useSocket(sessionId ? { type: "session", id: sessionId } : null, {
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
  });

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
        const rid = useAuthStore.getState().restaurantId || "";
        const session = await sessionsService.open(TABLE_ID, rid, guest.id);
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
      if (sessionId) {
        const session = await sessionsService.getOne(sessionId);
        if (session.status !== "CLOSED") {
          const total = await sessionsService.getTotal(sessionId);
          if (total.total > 0) {
            toast.error("Existe uma conta pendente nesta mesa.");
            setLoggingOut(false);
            return;
          }
          await sessionsService.close(sessionId);
        }
      }
    } catch {
    } finally {
      setLoggingOut(false);
    }
    logout();
    router.push("/login");
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

  // ── Retorno — tudo que o page.tsx precisa ─────────────────────────────────
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
