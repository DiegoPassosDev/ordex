"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Category, Order } from "@/types";
import toast, { Toaster } from "react-hot-toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type Tab = "menu" | "orders";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export default function TablePage() {
  useRequireAuth("guest");
  const { guest, restaurantId, sessionId, setSessionId } = useAuthStore();

  const [tab, setTab] = useState<Tab>("menu");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [mounted, setMounted] = useState(false);

  const RESTAURANT_ID = restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";
  const TABLE_ID = "f25ca185-ee28-444c-9240-07704a97b30c";

  useEffect(() => {
    setMounted(true);
    loadMenu();
    if (sessionId) loadOrders();
  }, []);

  async function loadMenu() {
    try {
      setLoadingMenu(true);
      const data = await menuService.getCategoriesByRestaurant(RESTAURANT_ID);
      setCategories(data);
      if (data.length > 0) setActiveCategory(data[0].id);
    } catch {
      toast.error("Erro ao carregar o cardápio.");
    } finally {
      setLoadingMenu(false);
    }
  }

  async function loadOrders() {
    if (!sessionId) return;
    try {
      const data = await ordersService.getBySession(sessionId);
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

    setLoadingOrder(true);
    try {
      let currentSessionId = sessionId;

      if (!currentSessionId) {
        const session = await sessionsService.open(TABLE_ID, RESTAURANT_ID);
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

  const cartTotal = cart.reduce((acc, c) => acc + c.price * c.quantity, 0);
  const cartCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const activeOrders = orders.filter(
    (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-900 w-full max-w-md mx-auto relative">
      <Toaster position="top-center" />

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
                {guest?.name ? `Olá, ${guest.name.split(" ")[0]} !` : "Mesa 4"}
              </p>
            </div>
          </div>
          <button
            onClick={handleCallWaiter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-medium"
          >
            <Bell className="w-3.5 h-3.5" />
            Chamar Garçom
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 bg-gray-700/50 rounded-xl p-1">
          <button
            onClick={() => setTab("menu")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === "menu"
                ? "bg-gray-600 text-white shadow-sm"
                : "text-gray-400"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 shrink-0" />
            Cardápio
          </button>
          <button
            onClick={() => {
              setTab("orders");
              loadOrders();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === "orders"
                ? "bg-gray-600 text-white shadow-sm"
                : "text-gray-400"
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            Pedidos
            {activeOrders.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center shrink-0">
                {activeOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Cardápio */}
      {tab === "menu" && (
        <div className="pb-32">
          {loadingMenu ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Categorias */}
              <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide sticky top-[116px] bg-gray-900 z-30">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
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
                  <div key={cat.id} id={cat.id} className="px-4 mb-6">
                    <h2 className="text-base font-bold text-white mb-3">
                      {cat.name}
                    </h2>
                    <div className="flex flex-col gap-3">
                      {cat.items.map((item) => {
                        const inCart = cart.find((c) => c.id === item.id);
                        return (
                          <div
                            key={item.id}
                            className={`bg-gray-800 rounded-2xl border p-4 transition-all ${
                              !item.available
                                ? "opacity-40 border-gray-700"
                                : "border-gray-700"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-100 text-sm">
                                    {item.name}
                                  </p>
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
                      <span className="text-sm text-gray-300">
                        {item.menuItem.name}
                      </span>
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
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowCart(false)}
          />
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
                  {/* Campo de observação */}
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
    </div>
  );
}
