"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, ShoppingCart, Loader2, X } from "lucide-react";
import { menuService } from "@/services/menu.service";
import { ordersService } from "@/services/orders.service";
import { toast } from "@/components/ui/Toast";
import type { Category, MenuItem } from "@/types";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface WaiterAddOrderModalProps {
  sessionId: string;
  guestId: string;
  restaurantId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function WaiterAddOrderModal({
  sessionId,
  guestId,
  restaurantId,
  onClose,
  onSuccess,
}: WaiterAddOrderModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    try {
      const data = await menuService.getCategoriesByRestaurant(restaurantId);
      setCategories(data);
    } catch {
      toast.error("Erro ao carregar cardápio.");
    } finally {
      setLoading(false);
    }
  }

  function getQuantity(itemId: string): number {
    return cart.find((c) => c.menuItem.id === itemId)?.quantity || 0;
  }

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.menuItem.id === itemId
            ? { ...c, quantity: c.quantity - 1 }
            : c,
        );
      }
      return prev.filter((c) => c.menuItem.id !== itemId);
    });
  }

  const totalItems = cart.reduce((acc, c) => acc + c.quantity, 0);
  const totalPrice = cart.reduce(
    (acc, c) => acc + c.menuItem.price * c.quantity,
    0,
  );

  const allItems = categories.flatMap((cat) => cat.items || []);
  const filteredItems =
    selectedCategory === "all"
      ? allItems.filter((i) => i.available)
      : categories
          .find((c) => c.id === selectedCategory)
          ?.items?.filter((i) => i.available) || [];

  async function handleConfirm() {
    if (cart.length === 0 || !guestId) return;
    setSaving(true);
    try {
      const items = cart.map((c) => ({
        menuItemId: c.menuItem.id,
        quantity: c.quantity,
      }));
      await ordersService.create(sessionId, guestId, items);
      toast.success("Pedido adicionado!");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao adicionar pedido.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto bg-gray-800 border-t border-gray-700 rounded-t-3xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-gray-300 hover:bg-gray-600 transition-colors"
            >
              ←
            </button>
            <h3 className="font-bold text-white text-lg">
              Adicionar Pedido
            </h3>
          </div>
          {totalItems > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-500/20 px-3 py-1.5 rounded-full">
              <ShoppingCart className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-medium text-orange-400">
                {totalItems}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 pb-3 overflow-x-auto shrink-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-orange-500 text-white"
                : "bg-gray-700 text-gray-400 hover:text-gray-200"
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-orange-500 text-white"
                  : "bg-gray-700 text-gray-400 hover:text-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          )}
          {!loading && filteredItems.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-12">
              Nenhum item disponível
            </p>
          )}
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const qty = getQuantity(item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-gray-700/50 rounded-2xl px-4 py-3"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-orange-400 font-medium">
                      R$ {item.price.toFixed(2)}
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {qty > 0 ? (
                      <>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-white hover:bg-gray-500 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-white">
                          {qty}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 hover:bg-orange-500/30 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {totalItems > 0 && (
          <div className="shrink-0 px-6 py-4 border-t border-gray-700">
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium transition-all"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              Adicionar {totalItems} item(ns) — R$ {totalPrice.toFixed(2)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
