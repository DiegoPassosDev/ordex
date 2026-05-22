"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { managerNavItems } from "@/lib/stock-nav";
import {
  Plus,
  X,
  Loader2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { CustomToaster } from "@/components/ui/Toast"; 
import { Header } from "@/components/layout/Header";
import { useStockItemsPage } from "./useStockItemsPage";

const UNITS = ["KG", "G", "L", "ML", "UN"];
const UNIT_LABEL: Record<string, string> = {
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
  UN: "un",
};

export default function StockItemsPage() {
  const {
    items,
    loading,
    showModal,
    setShowModal,
    saving,
    editItem,
    form,
    setForm,
    restaurantId,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  } = useStockItemsPage();

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
                title="Insumos"
                subtitle="Registre e gerencie os insumos do restaurante"
                restaurantId={restaurantId}
              />
            </div>
          </div>
          
          <div className="flex justify-end mb-6">
            <Button icon={Plus} onClick={openCreate}>
              Novo Insumo
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Todos os Insumos</CardTitle>
                <span className="text-xs text-gray-400">
                  {items.length} cadastrados
                </span>
              </CardHeader>

              {items.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">
                    Nenhum insumo cadastrado
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {items.map((item) => {
                  const isLow =
                    item.minQuantity > 0 && item.quantity <= item.minQuantity;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 sm:p-4 rounded-xl border transition-all ${
                        isLow
                          ? "bg-red-500/5 border-red-500/30"
                          : "bg-gray-800 border-gray-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-100">
                              {item.name}
                            </p>
                            {item.category && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                                {item.category}
                              </span>
                            )}
                            {isLow && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                <AlertTriangle className="w-3 h-3" /> Baixo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            <span className="text-xs text-gray-400">
                              Estoque:{" "}
                              <span
                                className={`font-semibold ${isLow ? "text-red-400" : "text-white"}`}
                              >
                                {item.quantity.toFixed(3)}{" "}
                                {UNIT_LABEL[item.unit]}
                              </span>
                            </span>
                            <span className="text-xs text-gray-400">
                              Mín:{" "}
                              <span className="text-gray-300">
                                {item.minQuantity.toFixed(3)}{" "}
                                {UNIT_LABEL[item.unit]}
                              </span>
                            </span>
                            <span className="text-xs text-gray-400">
                              Custo:{" "}
                              <span className="text-orange-400 font-semibold">
                                R$ {item.costPerUnit.toFixed(2)}/
                                {UNIT_LABEL[item.unit]}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => openEdit(item)}
                            className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-xs hover:bg-gray-600 transition-all"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-gray-800 rounded-t-3xl sm:rounded-2xl border border-gray-700 p-6 w-full sm:max-w-md mx-0 sm:mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">
                {editItem ? "Editar Insumo" : "Novo Insumo"}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Nome
                </label>
                <input
                  placeholder="Ex: Filé Mignon"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Unidade
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-4 py-3 h-[49px] rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Categoria
                  </label>
                  <input
                    placeholder="Ex: Carnes"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Qtd. Mínima
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={form.minQuantity}
                    onChange={(e) =>
                      setForm({ ...form, minQuantity: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Custo/unidade (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.costPerUnit}
                    onChange={(e) =>
                      setForm({ ...form, costPerUnit: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-center gap-3 mt-2">
                <Button
                  className="flex-1"
                  loading={saving}
                  onClick={handleSave}
                >
                  {editItem ? "Salvar" : "Criar"}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 bg-gray-700 border-gray-600 text-gray-300"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
