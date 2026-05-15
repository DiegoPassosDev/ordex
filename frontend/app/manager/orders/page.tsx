"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/auth.store";
import { ordersService } from "@/services/orders.service";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  LayoutGrid,
  ClipboardList,
  Users,
  UtensilsCrossed,
  TrendingUp,
  Settings,
  ChefHat,
  Package,
  Loader2,
  LogOut,
} from "lucide-react";
import { Order, OrderStatus, ORDER_STATUS_LABEL } from "@/types";
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

const STATUS_FILTERS: { label: string; value: OrderStatus | "ALL" }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Aguardando", value: "WAITING" },
  { label: "Em preparo", value: "PREPARING" },
  { label: "Pronto", value: "READY" },
  { label: "A caminho", value: "ON_THE_WAY" },
  { label: "Entregue", value: "DELIVERED" },
  { label: "Cancelado", value: "CANCELLED" },
];

export default function OrdersPage() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
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

  return (
    <div className="flex h-screen bg-gray-900">
      <CustomToaster />
      <Sidebar items={navItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          {/* Header */}
          <Header
            title=""
            subtitle="Acompanhe todos os pedidos em tempo real"
            restaurantId={restaurantId}
          />

          {/* Filtros — scroll horizontal no mobile */}
          <div className="flex gap-2 mb-5 overflow-x-auto overflow-y-hidden pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border whitespace-nowrap shrink-0 ${
                  filter === f.value
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-gray-800 text-gray-400 border-gray-700"
                }`}
              >
                {f.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    filter === f.value ? "bg-white/20" : "bg-gray-700"
                  }`}
                >
                  {counts[f.value] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          )}

          {!loading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm sm:text-base">
                  {filter === "ALL"
                    ? "Todos os Pedidos"
                    : ORDER_STATUS_LABEL[filter as OrderStatus]}
                </CardTitle>
                <span className="text-xs text-gray-400">
                  {filtered.length} pedidos
                </span>
              </CardHeader>

              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Nenhum pedido encontrado
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {filtered.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 sm:p-4 rounded-xl bg-gray-800 border border-gray-700"
                  >
                    {/* Linha superior — mesa + status + tempo + valor */}
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                          <span className="text-orange-400 text-xs font-bold">
                            {order.session?.table?.number ?? "?"}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-100 shrink-0">
                          Mesa {order.session?.table?.number ?? "?"}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-500 hidden sm:block">
                          {getElapsedMinutes(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Itens */}
                    <div className="space-y-0.5 mb-2">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-xs text-gray-400">
                          {item.quantity}x {item.menuItem?.name}
                          {item.notes && (
                            <span className="text-gray-500 italic">
                              {" "}
                              — {item.notes}
                            </span>
                          )}
                        </p>
                      ))}
                    </div>

                    {/* Linha inferior — garçom + cancelar */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {order.session?.waiter?.name || "Sem garçom"}
                      </p>
                      {order.status !== "CANCELLED" &&
                        order.status !== "DELIVERED" && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs"
                          >
                            Cancelar
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
