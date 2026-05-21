"use client";

import { useState, useEffect } from "react";
import { ordersService } from "@/services/orders.service";
import { useSocket } from "@/hooks/useSocket";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth.store";
import { Order } from "@/types";
import { toast } from "@/components/ui/Toast";

const RESTAURANT_ID = "f4385ae5-6187-40f8-97b4-d289d47dc441";

export function useKitchenPage() {
  useRequireAuth(["KITCHEN", "BAR"]);
  const employee = useAuthStore((s) => s.employee);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    setMounted(true);
    loadOrders();
  }, []);

  useSocket(
    { type: "restaurant", id: RESTAURANT_ID },
    {
      new_order: (order: Order) => {
        setOrders((prev) => {
          const exists = prev.find((o) => o.id === order.id);
          if (exists) return prev;
          return [order, ...prev];
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
        setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      },
    },
  );

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await ordersService.getByRestaurant(RESTAURANT_ID);
      const active = data.filter(
        (o: Order) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
      );
      setOrders(active);
    } catch {
      toast.error("Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await ordersService.updateStatus(id, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: status as any } : o)),
      );
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  }

  const waiting = orders.filter((o) => o.status === "WAITING");
  const preparing = orders.filter((o) => o.status === "PREPARING");
  const ready = orders.filter((o) => o.status === "READY");

  return {
    employee,
    orders,
    loading,
    mounted,
    waiting,
    preparing,
    ready,
    updateStatus,
    loadOrders,
  };
}
