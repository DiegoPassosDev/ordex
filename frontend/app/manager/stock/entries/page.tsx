"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { managerNavItems } from "@/lib/stock-nav";
import {
  Plus,
  X,
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Package,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { CustomToaster } from "@/components/ui/Toast";
import { Header } from "@/components/layout/Header";
import { useEntriesPage } from "./useEntriesPage";

const UNIT_LABEL: Record<string, string> = {
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
  UN: "un",
};

// ── Modal de confirmação de exclusão ─────────────────────────────────────────
function ConfirmDeleteModal({
  itemName,
  onConfirm,
  onCancel,
  loading,
}: {
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-sm shadow-xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-1">
              Excluir entrada
            </h3>
            <p className="text-sm text-gray-400">
              Você está prestes a excluir{" "}
              <span className="text-white font-medium">{itemName}</span>. Essa
              ação reverterá a quantidade no estoque e não poderá ser desfeita.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-600 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function EntriesPage() {
  const {
    groups,
    stockItems,
    suppliers,
    loading,
    showModal,
    setShowModal,
    saving,
    expandedGroups,
    editingEntryId,
    deleteTarget,
    setDeleteTarget,
    deleting,
    form,
    setForm,
    entryItems,
    totalGeral,
    openModal,
    toggleGroup,
    addEntryItem,
    removeEntryItem,
    updateEntryItem,
    handleEditEntry,
    requestDelete,
    confirmDelete,
    handleSave,
    restaurantId,
  } = useEntriesPage();

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
                title="Entradas de Estoque"
                subtitle="Registre compras e entradas"
                restaurantId={restaurantId}
              />
            </div>
          </div>

          <div className="flex justify-end mb-6">
            <Button icon={Plus} onClick={openModal}>
              Nova Entrada
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Entradas</CardTitle>
                <span className="text-xs text-gray-400">
                  {groups.length} entradas
                </span>
              </CardHeader>

              {groups.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Nenhuma entrada registrada
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {groups.map((group) => {
                  const isExpanded = expandedGroups.has(group.groupId);
                  return (
                    <div
                      key={group.groupId}
                      className="rounded-xl border border-gray-700 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleGroup(group.groupId)}
                        className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-750 transition-colors"
                      >
                        <div className="flex items-start gap-3 text-left">
                          <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-orange-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-100">
                                {group.items.length} insumo(s)
                              </p>
                              {group.supplier && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                                  {group.supplier.name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <p className="text-xs text-gray-500">
                                {new Date(group.createdAt).toLocaleDateString(
                                  "pt-BR",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                              {group.note && (
                                <p className="text-xs text-gray-500 italic">
                                  Entrada n° {group.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <p className="text-sm font-bold text-green-400">
                            R$ {group.totalCost.toFixed(2)}
                          </p>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-700 bg-gray-800/50">
                          {group.items.map((item: any, i: number) => (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between px-4 py-3 ${
                                i < group.items.length - 1
                                  ? "border-b border-gray-700/50"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                                <div>
                                  <p className="text-sm text-gray-200">
                                    {item.stockItem?.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.quantity.toFixed(3)}{" "}
                                    {UNIT_LABEL[item.stockItem?.unit]} × R${" "}
                                    {item.costPerUnit.toFixed(2)}/
                                    {UNIT_LABEL[item.stockItem?.unit]}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <p className="text-sm font-semibold text-green-400">
                                  R$ {item.totalCost.toFixed(2)}
                                </p>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditEntry(item);
                                    }}
                                    className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-all"
                                    title="Editar"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      requestDelete(item);
                                    }}
                                    className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteTarget && (
        <ConfirmDeleteModal
          itemName={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Modal Nova Entrada / Edição */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-gray-800 rounded-t-3xl sm:rounded-2xl border border-gray-700 p-6 w-full sm:max-w-2xl mx-0 sm:mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">
                {editingEntryId ? "Editar Entrada" : "Nova Entrada de Estoque"}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Fornecedor
                  </label>
                  <select
                    value={form.supplierId}
                    onChange={(e) =>
                      setForm({ ...form, supplierId: e.target.value })
                    }
                    className="w-full px-4 py-3 h-[49px] rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Sem fornecedor</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Observação
                  </label>
                  <input
                    placeholder="Nota fiscal, lote, etc."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <div className="grid grid-cols-12 gap-2 mb-2 px-1">
                  <p className="col-span-5 text-xs text-gray-500 font-medium">
                    Insumo
                  </p>
                  <p className="col-span-3 text-xs text-gray-500 font-medium">
                    Quantidade
                  </p>
                  <p className="col-span-3 text-xs text-gray-500 font-medium">
                    Custo/un (R$)
                  </p>
                </div>

                <div className="space-y-2">
                  {entryItems.map((item, i) => {
                    const selectedItem = stockItems.find(
                      (s) => s.id === item.stockItemId,
                    );
                    const subtotal =
                      (parseFloat(item.quantity) || 0) *
                      (parseFloat(item.costPerUnit) || 0);
                    return (
                      <div
                        key={i}
                        className="grid grid-cols-12 gap-2 items-center bg-gray-700/30 rounded-xl p-2"
                      >
                        <div className="col-span-5">
                          <select
                            value={item.stockItemId}
                            onChange={(e) =>
                              updateEntryItem(i, "stockItemId", e.target.value)
                            }
                            className="w-full px-3 py-2.5 h-[45px] rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                          >
                            <option value="">Selecione...</option>
                            {stockItems.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({UNIT_LABEL[s.unit]})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.001"
                            placeholder="0.000"
                            value={item.quantity}
                            onChange={(e) =>
                              updateEntryItem(i, "quantity", e.target.value)
                            }
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={item.costPerUnit}
                            onChange={(e) =>
                              updateEntryItem(i, "costPerUnit", e.target.value)
                            }
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            onClick={() => removeEntryItem(i)}
                            disabled={
                              entryItems.length === 1 || !!editingEntryId
                            }
                            className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all disabled:opacity-30"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {subtotal > 0 && (
                          <div className="col-span-12 px-1">
                            <p className="text-xs text-gray-500">
                              {selectedItem?.name} · subtotal:
                              <span className="text-green-400 font-medium ml-1">
                                R$ {subtotal.toFixed(2)}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!editingEntryId && (
                  <button
                    onClick={addEntryItem}
                    className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-gray-600 text-gray-400 text-sm hover:border-orange-500/50 hover:text-orange-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Adicionar outro insumo
                  </button>
                )}
              </div>

              {totalGeral > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Total da entrada</p>
                    <p className="text-xs text-gray-500">
                      {entryItems.length} insumo(s)
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-400">
                    R$ {totalGeral.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-700">
              <Button
                className="flex-1"
                icon={editingEntryId ? Pencil : Plus}
                loading={saving}
                onClick={handleSave}
              >
                {editingEntryId
                  ? "Salvar Alterações"
                  : `Registrar ${entryItems.length > 1 ? `${entryItems.length} Entradas` : "Entrada"}`}
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
      )}
    </div>
  );
}
