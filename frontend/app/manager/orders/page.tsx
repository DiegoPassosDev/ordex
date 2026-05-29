"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ItemTimer } from "@/components/ui/ItemTimer";
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
} from "lucide-react";
import { OrderStatus, ORDER_STATUS_LABEL } from "@/types";
import { CustomToaster } from "@/components/ui/Toast";
import { Header } from "@/components/layout/Header";
import { useOrdersPage } from "./useOrdersPage";

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
  const {
    filter,
    setFilter,
    loading,
    filtered,
    counts,
    handleCancel,
    getElapsedMinutes,
    restaurantId,
  } = useOrdersPage();

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
                    <div className="space-y-1.5 mb-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-gray-700 flex items-center justify-center text-gray-300 text-xs font-bold shrink-0">
                            {item.quantity}
                          </span>
                          <span className="text-xs text-gray-200 flex-1 min-w-0 truncate">
                            {item.menuItem?.name}
                            {item.notes && (
                              <span className="text-gray-500 italic"> — {item.notes}</span>
                            )}
                          </span>
                          <ItemTimer
                            date={order.createdAt}
                            prepTime={item.menuItem?.prepTimeMin ?? 10}
                            status={item.status}
                            statusChangedAt={item.statusChangedAt}
                          />
                        </div>
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
