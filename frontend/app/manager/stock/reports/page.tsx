"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { managerNavItems } from "@/lib/stock-nav";
import { Bell, LogOut, Loader2, ArrowLeft, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function StockReportsPage() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"margin" | "profit" | "cost">("margin");

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      setLoading(true);
      const { data } = await api.get(`/stock/report/profit/${restaurantId}`);
      setReport(data);
    } catch {
      toast.error("Erro ao carregar relatório.");
    } finally {
      setLoading(false);
    }
  }

  const sorted = [...report].sort((a, b) => b[sortBy] - a[sortBy]);
  const withRecipe = report.filter((i) => i.hasRecipe);
  const avgMargin =
    withRecipe.length > 0
      ? withRecipe.reduce((acc, i) => acc + i.margin, 0) / withRecipe.length
      : 0;
  const totalProfit = withRecipe.reduce((acc, i) => acc + i.profit, 0);

  return (
    <div className="flex h-screen bg-gray-900">
      <Toaster position="top-right" />
      <Sidebar items={managerNavItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/manager/stock"
                className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Análise de Lucro
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Custo e margem por produto
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
              </button>
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {employee?.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "DG"}
                </span>
              </div>
              <button
                onClick={() => {
                  clearAuth();
                  router.push("/login");
                }}
                className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
                  <p className="text-xs text-gray-400 mb-1">
                    Pratos com Receita
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {withRecipe.length}
                    <span className="text-sm text-gray-500">
                      /{report.length}
                    </span>
                  </p>
                </div>
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
                  <p className="text-xs text-gray-400 mb-1">Margem Média</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {avgMargin.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
                  <p className="text-xs text-gray-400 mb-1">
                    Lucro Médio por Prato
                  </p>
                  <p className="text-2xl font-bold text-green-400">
                    R${" "}
                    {withRecipe.length > 0
                      ? (totalProfit / withRecipe.length).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>

              {/* Ordenação */}
              <div className="flex gap-2 mb-4">
                {[
                  { key: "margin", label: "Margem %" },
                  { key: "profit", label: "Lucro R$" },
                  { key: "cost", label: "Custo R$" },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      sortBy === s.key
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-gray-800 text-gray-400 border-gray-700"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Lucro por Produto</CardTitle>
                  <span className="text-xs text-gray-400">
                    {report.length} produtos
                  </span>
                </CardHeader>

                {report.length === 0 && (
                  <div className="text-center py-12">
                    <TrendingUp className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      Nenhum produto no cardápio
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {sorted.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-gray-800 border border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-100">
                              {item.name}
                            </p>
                            <span className="text-xs text-gray-500">
                              {item.category}
                            </span>
                            {!item.hasRecipe && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                Sem receita
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`text-sm font-bold ${item.margin >= 60 ? "text-green-400" : item.margin >= 30 ? "text-yellow-400" : "text-red-400"}`}
                          >
                            {item.margin.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500">Venda</p>
                          <p className="text-gray-200 font-medium">
                            R$ {item.price.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Custo</p>
                          <p className="text-orange-400 font-medium">
                            R$ {item.cost.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Lucro</p>
                          <p
                            className={`font-medium ${item.profit >= 0 ? "text-green-400" : "text-red-400"}`}
                          >
                            R$ {item.profit.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {item.hasRecipe && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${item.margin >= 60 ? "bg-green-400" : item.margin >= 30 ? "bg-yellow-400" : "bg-red-400"}`}
                              style={{
                                width: `${Math.min(item.margin, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
