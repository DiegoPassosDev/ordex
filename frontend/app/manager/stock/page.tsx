"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { managerNavItems } from "@/lib/stock-nav";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  LogOut,
  Loader2,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CustomToaster, toast } from "@/components/ui/Toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Header } from "@/components/layout/Header";

const UNIT_LABEL: Record<string, string> = {
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
  UN: "un",
};

export default function StockDashboard() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      setLoading(true);
      const { data } = await api.get(`/stock/report/stock/${restaurantId}`);
      setReport(data);
    } catch {
      toast.error("Erro ao carregar estoque.");
    } finally {
      setLoading(false);
    }
  }

  const stockLinks = [
    {
      href: "/manager/stock/inventory",
      label: "Visão do Estoque",
      desc: "Quantidade, valor e status de cada insumo",
      icon: BarChart2,
      highlight: true,
    },
    {
      href: "/manager/stock/items",
      label: "Insumos e Produtos",
      desc: "Cadastre e gerencie seus itens de estoque",
      icon: Package,
    },
    {
      href: "/manager/stock/entries",
      label: "Entradas",
      desc: "Registre compras e entradas de estoque",
      icon: TrendingDown,
    },
    {
      href: "/manager/stock/suppliers",
      label: "Fornecedores",
      desc: "Gerencie seus fornecedores",
      icon: Package,
    },
    {
      href: "/manager/stock/purchases",
      label: "Pedidos de Compra",
      desc: "Crie e acompanhe pedidos para fornecedores",
      icon: Package,
    },
    {
      href: "/manager/stock/recipes",
      label: "Receitas dos Pratos",
      desc: "Defina os ingredientes de cada prato",
      icon: Package,
    },
    {
      href: "/manager/stock/reports",
      label: "Análise de Lucro",
      desc: "Custo e margem por produto",
      icon: TrendingDown,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-900">
      <CustomToaster />
      <Sidebar items={managerNavItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          {/* Header */}
          <Header
            title=""
            subtitle="Controle de Estoque"
            restaurantId={restaurantId}
          />
          

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-gray-400">Total de Itens</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {report?.totalItems ?? 0}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <p className="text-xs text-gray-400">Estoque Baixo</p>
                  </div>
                  <p className="text-2xl font-bold text-red-400">
                    {report?.lowStock?.length ?? 0}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-gray-400">Valor em Estoque</p>
                  </div>
                  <p className="text-xl font-bold text-green-400">
                    R$ {(report?.totalValue ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-orange-400" />
                    <p className="text-xs text-gray-400">Alertas Ativos</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-400">
                    {report?.lowStock?.length ?? 0}
                  </p>
                </div>
              </div>

              {/* Links de navegação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stockLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`border rounded-2xl p-5 transition-all group ${
                      link.highlight
                        ? "bg-orange-500/10 border-orange-500/40 hover:border-orange-500"
                        : "bg-gray-800 border-gray-700 hover:border-orange-500/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p
                        className={`font-semibold text-sm group-hover:text-orange-400 transition-colors ${
                          link.highlight ? "text-orange-400" : "text-white"
                        }`}
                      >
                        {link.label}
                      </p>
                      <ChevronRight
                        className={`w-4 h-4 transition-colors group-hover:text-orange-400 ${
                          link.highlight ? "text-orange-400" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{link.desc}</p>
                  </Link>
                ))}
              </div>

              {/* Alertas de estoque baixo */}
              {report?.lowStock?.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <p className="text-sm font-semibold text-red-400">
                      {report.lowStock.length} item(s) com estoque baixo
                    </p>
                  </div>
                  <div className="space-y-2">
                    {report.lowStock.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-300">
                          {item.name}
                        </span>
                        <span className="text-xs text-red-400 font-medium">
                          {item.quantity.toFixed(3)} {UNIT_LABEL[item.unit]} /{" "}
                          mín {item.minQuantity.toFixed(3)}{" "}
                          {UNIT_LABEL[item.unit]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
