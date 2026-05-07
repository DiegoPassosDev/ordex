"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { managerNavItems } from "@/lib/stock-nav";
import { Plus, X, Bell, LogOut, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const UNIT_LABEL: Record<string, string> = {
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
  UN: "un",
};

export default function EntriesPage() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [entries, setEntries] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplierId: "", note: "" });
  const [entryItems, setEntryItems] = useState([
    { stockItemId: "", quantity: "", costPerUnit: "" },
  ]);

  function addEntryItem() {
    setEntryItems([
      ...entryItems,
      { stockItemId: "", quantity: "", costPerUnit: "" },
    ]);
  }

  function removeEntryItem(i: number) {
    if (entryItems.length === 1) return;
    setEntryItems(entryItems.filter((_, idx) => idx !== i));
  }

  function updateEntryItem(i: number, field: string, value: string) {
    const updated = [...entryItems];
    updated[i] = { ...updated[i], [field]: value };
    setEntryItems(updated);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [entriesRes, itemsRes, suppliersRes] = await Promise.all([
        api.get(`/stock/entries/restaurant/${restaurantId}`),
        api.get(`/stock/items/restaurant/${restaurantId}`),
        api.get(`/suppliers/restaurant/${restaurantId}`),
      ]);
      setEntries(entriesRes.data);
      setStockItems(itemsRes.data);
      setSuppliers(suppliersRes.data);
    } catch {
      toast.error("Erro ao carregar entradas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const valid = entryItems.every(
      (i) =>
        i.stockItemId &&
        parseFloat(i.quantity) > 0 &&
        parseFloat(i.costPerUnit) > 0,
    );
    if (!valid) {
      toast.error("Preencha todos os itens corretamente.");
      return;
    }
    setSaving(true);
    try {
      // Registra todas as entradas em paralelo
      await Promise.all(
        entryItems.map((item) =>
          api.post("/stock/entries", {
            stockItemId: item.stockItemId,
            supplierId: form.supplierId || undefined,
            restaurantId,
            quantity: parseFloat(item.quantity),
            costPerUnit: parseFloat(item.costPerUnit),
            note: form.note || undefined,
          }),
        ),
      );
      toast.success(`${entryItems.length} entrada(s) registrada(s)!`);
      setShowModal(false);
      setForm({ supplierId: "", note: "" });
      setEntryItems([{ stockItemId: "", quantity: "", costPerUnit: "" }]);
      loadAll();
    } catch {
      toast.error("Erro ao registrar entradas.");
    } finally {
      setSaving(false);
    }
  }

  const totalGeral = entryItems.reduce(
    (acc, i) =>
      acc + (parseFloat(i.quantity) || 0) * (parseFloat(i.costPerUnit) || 0),
    0,
  );

  return (
    <div className="flex h-screen bg-gray-900">
      <Toaster position="top-right" />
      <Sidebar items={managerNavItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/manager/stock"
                className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Entradas de Estoque
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Registre compras e entradas
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

          <div className="flex justify-end mb-6">
            <Button icon={Plus} onClick={() => setShowModal(true)}>
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
                  {entries.length} registros
                </span>
              </CardHeader>

              {entries.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">
                    Nenhuma entrada registrada
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl bg-gray-800 border border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-100">
                          {entry.stockItem?.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-gray-400">
                            Qtd:{" "}
                            <span className="text-white font-medium">
                              {entry.quantity.toFixed(3)}{" "}
                              {UNIT_LABEL[entry.stockItem?.unit]}
                            </span>
                          </span>
                          <span className="text-xs text-gray-400">
                            Custo unit.:{" "}
                            <span className="text-orange-400 font-medium">
                              R$ {entry.costPerUnit.toFixed(2)}
                            </span>
                          </span>
                          {entry.supplier && (
                            <span className="text-xs text-gray-500">
                              Fornecedor: {entry.supplier.name}
                            </span>
                          )}
                        </div>
                        {entry.note && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            {entry.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(entry.createdAt).toLocaleDateString(
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
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-green-400">
                          R$ {entry.totalCost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-gray-800 rounded-t-3xl sm:rounded-2xl border border-gray-700 p-6 w-full sm:max-w-2xl mx-0 sm:mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">
                Nova Entrada de Estoque
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-4">
              {/* Fornecedor e observação */}
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
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
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

              {/* Cabeçalho da tabela de itens */}
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
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
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
                            disabled={entryItems.length === 1}
                            className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all disabled:opacity-30"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {/* Subtotal da linha */}
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

                <button
                  onClick={addEntryItem}
                  className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-gray-600 text-gray-400 text-sm hover:border-orange-500/50 hover:text-orange-400 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Adicionar outro insumo
                </button>
              </div>

              {/* Total geral */}
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
                variant="secondary"
                className="flex-1 bg-gray-700 border-gray-600 text-gray-300"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                icon={Plus}
                loading={saving}
                onClick={handleSave}
              >
                Registrar{" "}
                {entryItems.length > 1
                  ? `${entryItems.length} Entradas`
                  : "Entrada"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
