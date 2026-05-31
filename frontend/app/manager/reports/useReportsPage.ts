"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { ordersService } from "@/services/orders.service";
import { Order } from "@/types";
import { toast } from "@/components/ui/Toast";
import { RESTAURANT_ID_FALLBACK } from "@/constants";

export function useReportsPage() {
  const { employee } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || RESTAURANT_ID_FALLBACK;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await ordersService.getByRestaurant(restaurantId);
      setOrders(data);
    } catch {
      toast.error("Erro ao carregar relatórios.");
    } finally {
      setLoading(false);
    }
  }

  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const cancelled = orders.filter((o) => o.status === "CANCELLED");
  const totalRevenue = delivered.reduce(
    (acc, o) => acc + o.items.reduce((s, i) => s + i.price * i.quantity, 0),
    0,
  );
  const ticketMedio =
    delivered.length > 0 ? totalRevenue / delivered.length : 0;

  const itemCount: Record<
    string,
    { name: string; count: number; revenue: number }
  > = {};
  delivered.forEach((o) => {
    o.items.forEach((item) => {
      const name = item.menuItem?.name || "Desconhecido";
      if (!itemCount[name]) itemCount[name] = { name, count: 0, revenue: 0 };
      itemCount[name].count += item.quantity;
      itemCount[name].revenue += item.price * item.quantity;
    });
  });
  const topItems = Object.values(itemCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const byStatus = {
    WAITING: orders.filter((o) => o.status === "WAITING").length,
    PREPARING: orders.filter((o) => o.status === "PREPARING").length,
    READY: orders.filter((o) => o.status === "READY").length,
    DELIVERED: delivered.length,
    CANCELLED: cancelled.length,
  };

  return {
    orders,
    loading,
    restaurantId,
    totalRevenue,
    ticketMedio,
    delivered,
    cancelled,
    topItems,
    byStatus,
    loadData,
  };
}
