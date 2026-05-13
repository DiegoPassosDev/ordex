"use client";

import { useState, useEffect, Suspense, useId } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuthStore } from "@/store/auth.store";
import { menuService } from "@/services/menu.service";
import { ordersService } from "@/services/orders.service";
import { sessionsService } from "@/services/sessions.service";
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Bell,
  ClipboardList,
  UtensilsCrossed,
  ChefHat,
  CheckCheck,
  Loader2,
  QrCode,
  LogOut,
  Camera,
} from "lucide-react";
import { Category, Order } from "@/types";
import { CustomToaster, toast } from "@/components/ui/Toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type Tab = "menu" | "orders";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

function getTableIdFromQrValue(value: string) {
  const decodedText = value.trim();

  try {
    const url = new URL(decodedText);
    const tableId = url.searchParams.get("tableId");
    if (tableId) return tableId;

    const [route, id] = url.pathname.split("/").filter(Boolean);
    if (route === "table" && id) return id;
  } catch {
    // QR with plain text: use the content as tableId.
  }

  return decodedText;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Componente da câmera QR
───────────────────────────────────────────────────────────────────────────── */
function QrScanner({ onScan }: { onScan: (tableId: string) => void }) {
  const reactId = useId();
  const containerId = `qr-reader-${reactId.replace(/:/g, "")}`;
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let scanner: any;
    // Flag que indica se o scanner chegou a iniciar com sucesso.
    // Sem ela, o cleanup tentava parar um scanner que ainda não existia,
    // causando o erro "Cannot stop, scanner is not running or paused".
    let started = false;
    let cancelled = false;

    function clearScannerDom() {
      document.getElementById(containerId)?.replaceChildren();
    }

    async function startScanner() {
      try {
        clearScannerDom();
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        scanner = new Html5Qrcode(containerId);

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            // Tenta extrair o tableId se o QR contiver uma URL completa
            let tableId = getTableIdFromQrValue(decodedText);
            try {
              const url = new URL(decodedText);
              const param = url.searchParams.get("tableId");
              if (param) tableId = param;
            } catch {
              // não era URL, usa o texto direto como tableId
            }

            // Marca como não iniciado antes de parar para evitar
            // que o cleanup tente parar novamente
            started = false;
            scanner.stop().catch(() => {});
            onScan(tableId);
          },
          () => {}, // erros de frame são normais, ignoramos
        );

        // Só marca como iniciado após o start() resolver com sucesso
        if (cancelled) {
          scanner.stop().catch(() => {});
          scanner.clear?.();
          clearScannerDom();
          return;
        }

        started = true;
        setStarting(false);
      } catch (err: any) {
        started = false;
        const msg =
          err?.message?.toLowerCase().includes("permission")
            ? "Permissão de câmera negada. Permita o acesso nas configurações do browser."
            : "Não foi possível acessar a câmera.";
        setError(msg);
        setStarting(false);
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      // Só tenta parar se o scanner realmente iniciou
      if (started && scanner) {
        started = false;
        scanner
          .stop()
          .then(() => scanner.clear?.())
          .catch(() => {})
          .finally(clearScannerDom);
      } else {
        scanner?.clear?.();
        clearScannerDom();
      }
    };
  }, [containerId]);

  if (error) {
    return (
      <div className="w-full rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {starting && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Iniciando câmera...
        </div>
      )}
      <div
        id={containerId}
        className="mx-auto aspect-square w-[min(78vw,300px)] rounded-2xl overflow-hidden bg-black"
      />
      <p className="text-gray-500 text-xs text-center">
        Aponte para o QR Code da mesa
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Tela de bloqueio
───────────────────────────────────────────────────────────────────────────── */
function QrGate({
  onScan,
  onLogout,
  loggingOut,
}: {
  onScan: (tableId: string) => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const [scanning, setScanning] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 w-full max-w-md mx-auto flex flex-col items-center justify-center px-8 gap-6">
      <CustomToaster />

      {!scanning ? (
        <>
          <div className="w-20 h-20 rounded-3xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <QrCode className="w-10 h-10 text-orange-400" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              Identifique sua mesa
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Escaneie o QR Code disponível na sua mesa para acessar o cardápio.
            </p>
          </div>
          <button
            onClick={() => setScanning(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm transition-all"
          >
            <Camera className="w-4 h-4" />
            Abrir câmera
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={loggingOut}
            className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Sair da conta
          </button>
        </>
      ) : (
        <>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-1">
              Escaneie o QR Code
            </h2>
            <p className="text-gray-400 text-sm">
              Aponte a câmera para o código da mesa
            </p>
          </div>
          <QrScanner onScan={onScan} />
          <button
            onClick={() => setScanning(false)}
            className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </>
      )}

      {/* Modal de confirmação de logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowLogoutModal(false)}
          />
          <div className="relative w-full max-w-sm bg-gray-800 border border-gray-700 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-1">
                <LogOut className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Encerrar sessão?</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Você precisará escanear o QR Code novamente para fazer novos pedidos.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-2xl bg-gray-700 border border-gray-600 text-gray-300 font-medium text-sm hover:bg-gray-600 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={onLogout}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-medium text-sm transition-all"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Página principal
───────────────────────────────────────────────────────────────────────────── */
function TablePageInner() {
  useRequireAuth("GUEST");
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

  const [tab, setTab] = useState<Tab>("menu");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [identifyingTable, setIdentifyingTable] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(
    null,
  );

  const RESTAURANT_ID =
    currentRestaurantId ||
    restaurantId ||
    "f4385ae5-6187-40f8-97b4-d289d47dc441";
  const TABLE_ID = tableIdFromUrl || tableIdFromStore;

  useEffect(() => {
    setMounted(true);
    if (TABLE_ID) {
      identifyTable(TABLE_ID);
    } else {
      loadMenu();
    }
    if (sessionId) loadOrders();
  }, []);

  function handleQrScan(scannedTableId: string) {
    identifyTable(scannedTableId, true);
  }

  async function identifyTable(id: string, showSuccess = false) {
    try {
      setIdentifyingTable(true);
      const table = await sessionsService.getTable(id);
      setTableId(table.id);
      setTableNumber(String(table.number));
      setCurrentRestaurantId(table.restaurantId);

      const session = await sessionsService.open(table.id, table.restaurantId, guest?.id);
      setSessionId(session.id);

      await Promise.all([loadMenu(table.restaurantId), loadOrders(session.id)]);
      if (showSuccess) toast.success(`Mesa ${table.number} identificada!`);
      setIdentifyingTable(false);
    } catch {
      toast.error("Nao foi possivel identificar a mesa.");
      setIdentifyingTable(false);
      // não crítico
    }
  }

  async function loadMenu(targetRestaurantId = RESTAURANT_ID) {
    try {
      setLoadingMenu(true);
      const data = await menuService.getCategoriesByRestaurant(targetRestaurantId);
      setCategories(data);
      if (data.length > 0) setActiveCategory(data[0].id);
    } catch {
      toast.error("Erro ao carregar o cardápio.");
    } finally {
      setLoadingMenu(false);
    }
  }

  async function loadOrders(targetSessionId = sessionId) {
    if (!targetSessionId) return;
    try {
      const data = await ordersService.getBySession(targetSessionId);
      setOrders(data);
    } catch {
      console.error("Erro ao carregar pedidos");
    }
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
    toast.success(`${item.name} adicionado!`, { duration: 1500 });
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
  }

  function updateNotes(id: string, notes: string) {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, notes } : c)));
  }

  async function confirmOrder() {
    if (cart.length === 0) return;
    if (!guest) {
      toast.error("Você precisa estar logado para fazer um pedido.");
      return;
    }
    if (!TABLE_ID) {
      toast.error("Mesa não identificada. Escaneie o QR Code.");
      return;
    }

    setLoadingOrder(true);
    try {
      let currentSessionId = sessionId;

      if (!currentSessionId) {
        const session = await sessionsService.open(TABLE_ID, RESTAURANT_ID, guest?.id);
        currentSessionId = session.id;
        setSessionId(session.id);
      }

      if (!currentSessionId) {
        throw new Error("Não foi possível criar uma sessão para o pedido.");
      }

      await ordersService.create(
        currentSessionId,
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
      toast.error("Você precisa fazer um pedido primeiro.");
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
      // Erro de API não impede o logout — o cliente confirmou sair
    } finally {
      setLoggingOut(false);
    }

    logout();
    router.push("/login");
  }

  const cartTotal = cart.reduce((acc, c) => acc + c.price * c.quantity, 0);
  const cartCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const activeOrders = orders.filter(
    (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
  );

  if (!mounted) return null;

  if (!TABLE_ID) {
    return (
      <QrGate
        onScan={handleQrScan}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
    );
  }

  if (identifyingTable && !tableNumber) {
    return (
      <div className="min-h-screen bg-gray-900 w-full max-w-md mx-auto flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Identificando mesa...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 w-full max-w-md mx-auto relative">
      <CustomToaster />

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Ordex</p>
              <p className="text-xs text-gray-400">
                {guest?.name ? `${guest.name.split(" ")[0]}` : "Olá!"}
                {tableNumber ? ` · Mesa ${tableNumber}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCallWaiter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-medium"
            >
              <Bell className="w-3.5 h-3.5" />
              Garçom
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              disabled={loggingOut}
              className="w-8 h-8 rounded-xl bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all disabled:opacity-60"
              title="Sair"
            >
              {loggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 bg-gray-700/50 rounded-xl p-1">
          <button
            onClick={() => setTab("menu")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === "menu" ? "bg-gray-600 text-white shadow-sm" : "text-gray-400"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Cardápio
          </button>
          <button
            onClick={() => { setTab("orders"); loadOrders(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === "orders" ? "bg-gray-600 text-white shadow-sm" : "text-gray-400"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Meus Pedidos
            {activeOrders.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                {activeOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Cardápio */}
      {tab === "menu" && (
        <div className="w-full pb-32">
          {loadingMenu ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
            </div>
          ) : (
            <>
              <div className={`sticky top-[88px] z-30 bg-gray-900 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide transition-opacity duration-300 ${categories.length === 0 ? 'opacity-0' : 'opacity-100'}`}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeCategory === cat.id
                        ? "bg-orange-500 text-white"
                        : "bg-gray-800 text-gray-400 border border-gray-700"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {categories
                .filter((cat) => cat.id === activeCategory)
                .map((cat) => (
                  <div key={cat.id} className="px-4">
                    <div className="flex flex-col gap-3">
                      {cat.items.map((item) => {
                        const inCart = cart.find((c) => c.id === item.id);
                        return (
                          <div
                            key={item.id}
                            className={`bg-gray-800 rounded-2xl border p-4 flex items-start gap-3 ${
                              item.available ? "border-gray-700" : "border-gray-700 opacity-60"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-white text-sm">{item.name}</p>
                                {!item.available && (
                                  <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                                    Indisponível
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                              <p className="text-orange-400 font-bold text-sm mt-2">
                                R$ {item.price.toFixed(2)}
                              </p>
                            </div>

                            {item.available && (
                              <div className="shrink-0">
                                {inCart ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-sm font-bold text-white w-4 text-center">
                                      {inCart.quantity}
                                    </span>
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-sm"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      )}

      {/* Meus Pedidos */}
      {tab === "orders" && (
        <div className="w-full px-4 py-4 pb-32">
          <div className="flex flex-col gap-3">
            {orders.length === 0 && (
              <div className="text-center py-16">
                <ClipboardList className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhum pedido ainda</p>
              </div>
            )}
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-gray-800 rounded-2xl border border-gray-700 p-4 w-full"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="space-y-1.5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
                        {item.quantity}
                      </span>
                      <span className="text-sm text-gray-300">{item.menuItem.name}</span>
                    </div>
                  ))}
                </div>
                {order.status === "DELIVERED" && (
                  <div className="flex items-center gap-1.5 mt-3 text-green-400 text-xs">
                    <CheckCheck className="w-3.5 h-3.5" />
                    Entregue
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carrinho flutuante */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-orange-500 text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-lg shadow-orange-900/40"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xs font-bold">{cartCount}</span>
              </div>
              <span className="font-semibold text-sm">Ver carrinho</span>
            </div>
            <span className="font-bold">R$ {cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Modal do carrinho */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md mx-auto bg-gray-800 border-t border-gray-700 rounded-t-3xl p-6 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">Seu Pedido</h3>
              <button onClick={() => setShowCart(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 pb-3 border-b border-gray-700 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3 text-gray-300" />
                        </button>
                        <span className="text-sm font-bold text-white w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3 text-orange-400" />
                        </button>
                      </div>
                      <span className="text-sm text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Observação (ex: sem cebola)"
                    value={item.notes || ""}
                    onChange={(e) => updateNotes(item.id, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-gray-700 border border-gray-600 text-gray-300 text-xs placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              ))}
            </div>

            <div className="border-t border-gray-700 pt-4 mb-5">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-300">Total</span>
                <span className="font-bold text-orange-400 text-lg">
                  R$ {cartTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              icon={ShoppingCart}
              size="lg"
              className="w-full"
              loading={loadingOrder}
              onClick={confirmOrder}
            >
              Confirmar Pedido
            </Button>
          </div>
        </div>
      )}
      {/* Modal de confirmação de logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowLogoutModal(false)}
          />
          <div className="relative w-full max-w-sm bg-gray-800 border border-gray-700 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-1">
                <LogOut className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Encerrar sessão?</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Você precisará escanear o QR Code novamente para fazer novos pedidos.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-2xl bg-gray-700 border border-gray-600 text-gray-300 font-medium text-sm hover:bg-gray-600 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setShowLogoutModal(false); handleLogout(); }}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-medium text-sm transition-all"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TablePage() {
  return (
    <Suspense fallback={null}>
      <TablePageInner />
    </Suspense>
  );
}