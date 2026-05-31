"use client";

import { useState, useEffect } from "react";
import { ordersService } from "@/services/orders.service";
import { useSocket } from "@/hooks/useSocket";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth.store";
import { Order, EmployeeRole, CategoryType } from "@/types";
import { toast } from "@/components/ui/Toast";
import { RESTAURANT_ID_FALLBACK } from "@/constants";

const RESTAURANT_ID = RESTAURANT_ID_FALLBACK;

const ROLE_CATEGORIES: Record<"KITCHEN" | "BAR", CategoryType[]> = {
  KITCHEN: ["FOOD", "DESSERT"],
  BAR: ["DRINK"],
};

function filterOrderByRole(order: Order, role: EmployeeRole | undefined): Order | null {
  if (!role || role === "MANAGER" || role === "WAITER" || role === "CASHIER") return order;
  const allowed = ROLE_CATEGORIES[role as "KITCHEN" | "BAR"];
  if (!allowed) return order;
  const filtered = order.items.filter(
    (item) => item.menuItem?.category?.type && allowed.includes(item.menuItem.category.type),
  );
  if (filtered.length === 0) return null;
  return { ...order, items: filtered };
}

export function useKitchenPage() {
  useRequireAuth(["KITCHEN", "BAR"]);
  const employee = useAuthStore((s) => s.employee);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (employee?.role) {
      loadOrders();
    }
  }, [employee?.role]);

  const restId = employee?.restaurantId || RESTAURANT_ID;

  useSocket(
    { type: "restaurant", id: restId },
    {
      new_order: (order: Order) => {
        const filtered = filterOrderByRole(order, employee?.role);
        if (!filtered) return;
        setOrders((prev) => {
          const exists = prev.find((o) => o.id === filtered.id);
          if (exists) return prev;
          return [filtered, ...prev];
        });
        addNotification(
          "new_order",
          "Novo Pedido para Preparo",
          `Mesa ${order.session?.table?.number} enviou um novo pedido`,
          order.session?.table?.number,
        );
        toast.success(`Novo pedido — Mesa ${order.session?.table?.number}!`);
      },
      order_status_updated: (order: Order) => {
        const filtered = filterOrderByRole(order, employee?.role);
        if (!filtered) {
          setOrders((prev) => prev.filter((o) => o.id !== order.id));
          return;
        }
        setOrders((prev) => prev.map((o) => (o.id === filtered.id ? filtered : o)));
      },
      order_item_status_updated: (payload: { orderId: string; itemId: string; status: string; order: Order }) => {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== payload.orderId) return o;
            const updatedItems = o.items.map((item) =>
              item.id === payload.itemId ? { ...item, status: payload.status as any } : item,
            );
            const filtered = filterOrderByRole({ ...o, items: updatedItems }, employee?.role);
            if (!filtered) return null;
            return filtered;
          }).filter(Boolean) as Order[],
        );
      },
    },
  );

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await ordersService.getByRestaurant(restId);
      const active = data
        .filter(
          (o: Order) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
        )
        .map((o: Order) => filterOrderByRole(o, employee?.role))
        .filter(Boolean);
      setOrders(active as Order[]);
    } catch {
      toast.error("Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshOrdersSilent() {
    try {
      const data = await ordersService.getByRestaurant(restId);
      const active = data
        .filter(
          (o: Order) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
        )
        .map((o: Order) => filterOrderByRole(o, employee?.role))
        .filter(Boolean);
      setOrders(active as Order[]);
    } catch {
      // silent
    }
  }

  // ── Fallback ao voltar do standby / polling periódico ─────────────────
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshOrdersSilent();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = window.setInterval(refreshOrdersSilent, 30_000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [restId, employee?.role]);

  async function updateItemStatus(orderId: string, itemId: string, status: string) {
    try {
      await ordersService.updateItemStatus(orderId, itemId, status);
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const updatedItems = o.items.map((item) =>
            item.id === itemId ? { ...item, status: status as any } : item,
          );
          return { ...o, items: updatedItems };
        }),
      );
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  }

  function filterItemsByStatus(order: Order, status: string): Order | null {
    const filtered = order.items.filter((i) => i.status === status);
    if (filtered.length === 0) return null;
    return { ...order, items: filtered };
  }

  const waiting = orders.map((o) => filterItemsByStatus(o, "WAITING")).filter(Boolean) as Order[];
  const preparing = orders.map((o) => filterItemsByStatus(o, "PREPARING")).filter(Boolean) as Order[];
  const ready = orders.map((o) => filterItemsByStatus(o, "READY")).filter(Boolean) as Order[];

  return {
    employee,
    orders,
    loading,
    mounted,
    waiting,
    preparing,
    ready,
    updateItemStatus,
    loadOrders,
  };
}
