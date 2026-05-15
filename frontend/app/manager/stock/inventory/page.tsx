"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { managerNavItems } from "@/lib/stock-nav";
import {
  Bell,
  LogOut,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
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

type SortKey = "name" | "quantity" | "costPerUnit" | "totalValue";

export default function InventoryPage() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [filterLow, setFilterLow] = useState(false);

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

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const items: any[] = report?.items ?? [];

  const filtered = items
    .filter((item) => {
      const matchSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchLow = filterLow
        ? item.minQuantity > 0 && item.quantity <= item.minQuantity
        : true;
      return matchSearch && matchLow;
    })
    .sort((a, b) => {
      let valA: any;
      let valB: any;
      if (sortKey === "totalValue") {
        valA = a.quantity * a.costPerUnit;
        valB = b.quantity * b.costPerUnit;
      } else {
        valA = a[sortKey];
        valB = b[sortKey];
      }
      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc ? (
      <ChevronUp className="w-3 h-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-0.5" />
    );
  };

  const thClass =
    "text-xs text-gray-500 font-medium cursor-pointer hover:text-gray-300 transition-colors select-none";

  return (
    <div className="flex h-screen bg-gray-900">
      <CustomToaster />
      <Sidebar items={managerNavItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          {/* Header */}
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
                title="Visão do Estoque"
                subtitle="Quantidade, valor e status de cada insumo"
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-gray-400">Total de Insumos</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {report?.totalItems ?? 0}
                  </p>
                </div>

                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-gray-400">Valor Total</p>
                  </div>
                  <p className="text-xl font-bold text-green-400">
                    R$ {(report?.totalValue ?? 0).toFixed(2)}
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
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    <p className="text-xs text-gray-400">Custo Médio/Item</p>
                  </div>
                  <p className="text-xl font-bold text-orange-400">
                    R${" "}
                    {items.length > 0
                      ? (
                          items.reduce((acc, i) => acc + i.costPerUnit, 0) /
                          items.length
                        ).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>

              {/* Alerta de estoque baixo */}
              {report?.lowStock?.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <p className="text-sm font-semibold text-red-400">
                      {report.lowStock.length} insumo(s) abaixo do mínimo
                    </p>
                  </div>
                  <div className="space-y-2">
                    {report.lowStock.map((item: any) => {
                      const pct =
                        item.minQuantity > 0
                          ? Math.min(
                              (item.quantity / item.minQuantity) * 100,
                              100,
                            )
                          : 0;
                      return (
                        <div key={item.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-300">
                              {item.name}
                            </span>
                            <span className="text-xs text-red-400 font-medium">
                              {item.quantity.toFixed(3)} {UNIT_LABEL[item.unit]}{" "}
                              / mín {item.minQuantity.toFixed(3)}{" "}
                              {UNIT_LABEL[item.unit]}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-red-400 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    placeholder="Buscar insumo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-orange-500 placeholder:text-gray-500"
                  />
                </div>
                <button
                  onClick={() => setFilterLow((prev) => !prev)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
                    filterLow
                      ? "bg-red-500/20 text-red-400 border-red-500/40"
                      : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Somente críticos
                </button>
              </div>

              {/* Tabela / Lista */}
              <Card>
                <CardHeader>
                  <CardTitle>Insumos em Estoque</CardTitle>
                  <span className="text-xs text-gray-400">
                    {filtered.length} de {items.length} insumos
                  </span>
                </CardHeader>

                {filtered.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      Nenhum insumo encontrado
                    </p>
                  </div>
                )}

                {/* Cabeçalho da tabela — visível só em sm+ */}
                {filtered.length > 0 && (
                  <div className="hidden sm:grid grid-cols-12 gap-3 px-4 pb-2 border-b border-gray-700/50">
                    <button
                      className={`${thClass} col-span-4 text-left`}
                      onClick={() => toggleSort("name")}
                    >
                      Insumo <SortIcon col="name" />
                    </button>
                    <button
                      className={`${thClass} col-span-2 text-right`}
                      onClick={() => toggleSort("quantity")}
                    >
                      Qtd. atual <SortIcon col="quantity" />
                    </button>
                    <p className="col-span-1 text-xs text-gray-500 font-medium text-center">
                      Mín.
                    </p>
                    <button
                      className={`${thClass} col-span-2 text-right`}
                      onClick={() => toggleSort("costPerUnit")}
                    >
                      Custo/un <SortIcon col="costPerUnit" />
                    </button>
                    <button
                      className={`${thClass} col-span-2 text-right`}
                      onClick={() => toggleSort("totalValue")}
                    >
                      Valor total <SortIcon col="totalValue" />
                    </button>
                    <p className="col-span-1 text-xs text-gray-500 font-medium text-center">
                      Status
                    </p>
                  </div>
                )}

                <div className="space-y-2 mt-2">
                  {filtered.map((item) => {
                    const isLow =
                      item.minQuantity > 0 && item.quantity <= item.minQuantity;
                    const totalValue = item.quantity * item.costPerUnit;
                    const pct =
                      item.minQuantity > 0
                        ? Math.min(
                            (item.quantity / item.minQuantity) * 100,
                            100,
                          )
                        : 100;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border transition-all ${
                          isLow
                            ? "bg-red-500/5 border-red-500/20"
                            : "bg-gray-800 border-gray-700"
                        }`}
                      >
                        {/* Mobile layout */}
                        <div className="sm:hidden p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-gray-100">
                                  {item.name}
                                </p>
                                {item.category && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Custo:{" "}
                                <span className="text-orange-400 font-medium">
                                  R$ {item.costPerUnit.toFixed(2)}/
                                  {UNIT_LABEL[item.unit]}
                                </span>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p
                                className={`text-sm font-bold ${isLow ? "text-red-400" : "text-white"}`}
                              >
                                {item.quantity.toFixed(3)}{" "}
                                {UNIT_LABEL[item.unit]}
                              </p>
                              <p className="text-xs text-green-400 font-medium">
                                R$ {totalValue.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Barra de nível */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  isLow
                                    ? "bg-red-400"
                                    : pct < 50
                                      ? "bg-yellow-400"
                                      : "bg-green-400"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            {isLow && (
                              <span className="flex items-center gap-1 text-xs text-red-400 shrink-0">
                                <AlertTriangle className="w-3 h-3" /> Baixo
                              </span>
                            )}
                          </div>

                          {item.minQuantity > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              Mínimo: {item.minQuantity.toFixed(3)}{" "}
                              {UNIT_LABEL[item.unit]}
                            </p>
                          )}
                        </div>

                        {/* Desktop layout */}
                        <div className="hidden sm:grid grid-cols-12 gap-3 items-center px-4 py-3">
                          <div className="col-span-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-100">
                                {item.name}
                              </p>
                              {item.category && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            {/* Barra de nível */}
                            <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                              <div
                                className={`h-1 rounded-full transition-all ${
                                  isLow
                                    ? "bg-red-400"
                                    : pct < 50
                                      ? "bg-yellow-400"
                                      : "bg-green-400"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          <p
                            className={`col-span-2 text-sm font-semibold text-right ${
                              isLow ? "text-red-400" : "text-white"
                            }`}
                          >
                            {item.quantity.toFixed(3)} {UNIT_LABEL[item.unit]}
                          </p>

                          <p className="col-span-1 text-xs text-gray-500 text-center">
                            {item.minQuantity > 0
                              ? `${item.minQuantity.toFixed(3)} ${UNIT_LABEL[item.unit]}`
                              : "—"}
                          </p>

                          <p className="col-span-2 text-sm text-orange-400 font-medium text-right">
                            R$ {item.costPerUnit.toFixed(2)}/
                            {UNIT_LABEL[item.unit]}
                          </p>

                          <p className="col-span-2 text-sm text-green-400 font-semibold text-right">
                            R$ {totalValue.toFixed(2)}
                          </p>

                          <div className="col-span-1 flex justify-center">
                            {isLow ? (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                <AlertTriangle className="w-3 h-3" /> Baixo
                              </span>
                            ) : pct < 50 ? (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                <TrendingDown className="w-3 h-3" /> Médio
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                <TrendingUp className="w-3 h-3" /> OK
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
