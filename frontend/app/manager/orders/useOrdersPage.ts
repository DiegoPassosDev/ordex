"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { ordersService } from "@/services/orders.service";
import { Order, OrderStatus } from "@/types";
import { toast } from "@/components/ui/Toast";

export function useOrdersPage() {
  const { employee } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await ordersService.getByRestaurant(restaurantId);
      setOrders(data);
    } catch {
      toast.error("Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(orderId: string) {
    if (!confirm("Deseja cancelar este pedido?")) return;
    try {
      await ordersService.cancel(orderId);
      toast.success("Pedido cancelado.");
      loadOrders();
    } catch {
      toast.error("Erro ao cancelar pedido.");
    }
  }

  function getElapsedMinutes(date: string): string {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    return `${minutes}m`;
  }

  const filtered =
    filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const counts: Record<string, number> = {
    ALL: orders.length,
    WAITING: orders.filter((o) => o.status === "WAITING").length,
    PREPARING: orders.filter((o) => o.status === "PREPARING").length,
    READY: orders.filter((o) => o.status === "READY").length,
    ON_THE_WAY: orders.filter((o) => o.status === "ON_THE_WAY").length,
    DELIVERED: orders.filter((o) => o.status === "DELIVERED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  };

  return {
    orders,
    filter,
    setFilter,
    loading,
    restaurantId,
    filtered,
    counts,
    loadOrders,
    handleCancel,
    getElapsedMinutes,
  };
}
