"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/auth.store";
import { ordersService } from "@/services/orders.service";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  LayoutGrid,
  ClipboardList,
  Users,
  UtensilsCrossed,
  TrendingUp,
  Settings,
  ChefHat,
  Package,
  Bell,
  LogOut,
  Loader2,
} from "lucide-react";
import { Order } from "@/types";
import { useRouter } from "next/navigation";
import { CustomToaster, toast } from "@/components/ui/Toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Header } from "@/components/layout/Header";

const navItems = [
  { href: "/manager", icon: LayoutGrid, label: "Dashboard" },
  { href: "/manager/tables", icon: UtensilsCrossed, label: "Mesas" },
  { href: "/manager/orders", icon: ClipboardList, label: "Pedidos" },
  { href: "/manager/menu", icon: ChefHat, label: "Cardápio" },
  { href: "/manager/employees", icon: Users, label: "Equipe" },
  { href: "/manager/stock", icon: Package, label: "Estoque" },
  { href: "/manager/reports", icon: TrendingUp, label: "Relatórios" },
  { href: "/manager/settings", icon: Settings, label: "Configurações" },
];

export default function ReportsPage() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

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

  // Cálculos dos relatórios
  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const cancelled = orders.filter((o) => o.status === "CANCELLED");
  const totalRevenue = delivered.reduce(
    (acc, o) => acc + o.items.reduce((s, i) => s + i.price * i.quantity, 0),
    0,
  );
  const ticketMedio =
    delivered.length > 0 ? totalRevenue / delivered.length : 0;

  // Itens mais pedidos
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

  // Pedidos por status
  const byStatus = {
    WAITING: orders.filter((o) => o.status === "WAITING").length,
    PREPARING: orders.filter((o) => o.status === "PREPARING").length,
    READY: orders.filter((o) => o.status === "READY").length,
    DELIVERED: delivered.length,
    CANCELLED: cancelled.length,
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <CustomToaster />
      <Sidebar items={navItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          {/* Header */}
          <Header
            title="Relatórios"
            subtitle="Análises e estatísticas do restaurante"
            restaurantId={restaurantId}
          />

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          )}

          {!loading && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 sm:p-5">
                  <p className="text-xs text-gray-400 mb-1">
                    Faturamento Total
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">
                    R$ {totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 sm:p-5">
                  <p className="text-xs text-gray-400 mb-1">Ticket Médio</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-400">
                    R$ {ticketMedio.toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 sm:p-5">
                  <p className="text-xs text-gray-400 mb-1">
                    Pedidos Entregues
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {delivered.length}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 sm:p-5">
                  <p className="text-xs text-gray-400 mb-1">
                    Taxa de Cancelamento
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-red-400">
                    {orders.length > 0
                      ? ((cancelled.length / orders.length) * 100).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Itens mais pedidos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Itens Mais Pedidos</CardTitle>
                    <span className="text-xs text-gray-400">Top 5</span>
                  </CardHeader>

                  {topItems.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8">
                      Nenhum pedido entregue ainda
                    </p>
                  )}

                  <div className="space-y-3">
                    {topItems.map((item, i) => {
                      const maxCount = topItems[0]?.count || 1;
                      const pct = (item.count / maxCount) * 100;
                      return (
                        <div key={item.name}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
                                {i + 1}
                              </span>
                              <span className="text-sm text-gray-200 truncate">
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400">
                                {item.count}x
                              </span>
                              <span className="text-xs font-semibold text-green-400">
                                R$ {item.revenue.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-orange-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Pedidos por status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pedidos por Status</CardTitle>
                    <span className="text-xs text-gray-400">
                      {orders.length} total
                    </span>
                  </CardHeader>

                  <div className="space-y-3">
                    {[
                      {
                        label: "Aguardando",
                        key: "WAITING",
                        color: "bg-yellow-400",
                      },
                      {
                        label: "Em Preparo",
                        key: "PREPARING",
                        color: "bg-blue-400",
                      },
                      { label: "Pronto", key: "READY", color: "bg-green-400" },
                      {
                        label: "Entregue",
                        key: "DELIVERED",
                        color: "bg-gray-400",
                      },
                      {
                        label: "Cancelado",
                        key: "CANCELLED",
                        color: "bg-red-400",
                      },
                    ].map((s) => {
                      const count = byStatus[s.key as keyof typeof byStatus];
                      const pct =
                        orders.length > 0 ? (count / orders.length) * 100 : 0;
                      return (
                        <div key={s.key}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${s.color}`}
                              />
                              <span className="text-sm text-gray-200">
                                {s.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400">
                                {pct.toFixed(1)}%
                              </span>
                              <span className="text-sm font-bold text-white w-6 text-right">
                                {count}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div
                              className={`${s.color} h-1.5 rounded-full transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
