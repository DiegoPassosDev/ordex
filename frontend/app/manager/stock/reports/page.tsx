"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { managerNavItems } from "@/lib/stock-nav";
import { Loader2, ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { CustomToaster } from "@/components/ui/Toast";
import { Header } from "@/components/layout/Header";
import { useStockReportsPage } from "./useStockReportsPage";

export default function StockReportsPage() {
  const {
    loading,
    sortBy,
    setSortBy,
    sorted,
    withRecipe,
    avgMargin,
    totalProfit,
    report,
    restaurantId,
  } = useStockReportsPage();

  return (
    <div className="flex h-screen bg-gray-900">
      <CustomToaster />
      <Sidebar items={managerNavItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          <div className="flex items-start gap-4 mb-1">
            {/* Seta */}
            <Link
              href="/manager/stock"
              className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            {/* Header ocupa toda largura restante */}
            <div className="flex-1 min-w-0">
              <Header
                title="Análise de Lucro"
                subtitle="Custo e margem por produto"
                restaurantId={restaurantId}
              />
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
