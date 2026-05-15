"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { managerNavItems } from "@/lib/stock-nav";
import {
  Plus,
  X,
  Bell,
  LogOut,
  Loader2,
  ArrowLeft,
  ShoppingCart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CustomToaster, toast } from "@/components/ui/Toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Header } from "@/components/layout/Header";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviado",
  RECEIVED: "Recebido",
  CANCELLED: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  SENT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  RECEIVED: "bg-green-500/20 text-green-400 border-green-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};
const UNIT_LABEL: Record<string, string> = {
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
  UN: "un",
};

export default function PurchasesPage() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    supplierId: "",
    notes: "",
    expectedAt: "",
  });
  const [orderItems, setOrderItems] = useState<any[]>([
    { stockItemId: "", quantity: "", costPerUnit: "" },
  ]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [ordersRes, suppliersRes, stockRes] = await Promise.all([
        api.get(`/purchase-orders/restaurant/${restaurantId}`),
        api.get(`/suppliers/restaurant/${restaurantId}`),
        api.get(`/stock/items/restaurant/${restaurantId}`),
      ]);
      setOrders(ordersRes.data);
      setSuppliers(suppliersRes.data);
      setStockItems(stockRes.data);
    } catch {
      toast.error("Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    setOrderItems([
      ...orderItems,
      { stockItemId: "", quantity: "", costPerUnit: "" },
    ]);
  }

  function removeItem(i: number) {
    setOrderItems(orderItems.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: string, value: string) {
    const updated = [...orderItems];
    updated[i] = { ...updated[i], [field]: value };
    setOrderItems(updated);
  }

  async function handleSave() {
    if (!form.supplierId) {
      toast.error("Selecione um fornecedor.");
      return;
    }
    const valid = orderItems.every(
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
      await api.post("/purchase-orders", {
        restaurantId,
        supplierId: form.supplierId,
        notes: form.notes || undefined,
        expectedAt: form.expectedAt || undefined,
        items: orderItems.map((i) => ({
          stockItemId: i.stockItemId,
          quantity: parseFloat(i.quantity),
          costPerUnit: parseFloat(i.costPerUnit),
        })),
      });
      toast.success("Pedido criado!");
      setShowModal(false);
      setForm({ supplierId: "", notes: "", expectedAt: "" });
      setOrderItems([{ stockItemId: "", quantity: "", costPerUnit: "" }]);
      loadAll();
    } catch {
      toast.error("Erro ao criar pedido.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(id: string, status: string) {
    try {
      await api.patch(`/purchase-orders/${id}/status`, { status });
      toast.success(
        status === "RECEIVED"
          ? "Pedido recebido! Estoque atualizado."
          : "Status atualizado!",
      );
      loadAll();
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  }

  const totalOrder = orderItems.reduce(
    (acc, i) =>
      acc + (parseFloat(i.quantity) || 0) * (parseFloat(i.costPerUnit) || 0),
    0,
  );

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
                title="Pedidos de Compra"
                subtitle="Crie e acompanhe pedidos para fornecedores"
                restaurantId={restaurantId}
              />
            </div>
          </div>
          
          <div className="flex justify-end mb-6">
            <Button icon={Plus} onClick={() => setShowModal(true)}>
              Novo Pedido
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Pedidos de Compra</CardTitle>
                <span className="text-xs text-gray-400">
                  {orders.length} pedidos
                </span>
              </CardHeader>

              {orders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Nenhum pedido criado</p>
                </div>
              )}

              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-gray-800 border border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-100">
                            {order.supplier?.name}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLOR[order.status]}`}
                          >
                            {STATUS_LABEL[order.status]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString(
                            "pt-BR",
                          )}
                          {order.expectedAt &&
                            ` · Previsto: ${new Date(order.expectedAt).toLocaleDateString("pt-BR")}`}
                        </p>
                        {order.notes && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            {order.notes}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-bold text-green-400 shrink-0">
                        R$ {order.totalCost.toFixed(2)}
                      </p>
                    </div>

                    <div className="space-y-1 mb-3">
                      {order.items?.map((item: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-gray-400"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                          {item.stockItem?.name} — {item.quantity.toFixed(3)}{" "}
                          {UNIT_LABEL[item.stockItem?.unit]}
                          <span className="text-gray-600">
                            × R$ {item.costPerUnit.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.status === "DRAFT" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatus(order.id, "SENT")}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs hover:bg-blue-500/20 transition-all"
                        >
                          Marcar Enviado
                        </button>
                        <button
                          onClick={() => handleStatus(order.id, "CANCELLED")}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/20 transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                    {order.status === "SENT" && (
                      <button
                        onClick={() => handleStatus(order.id, "RECEIVED")}
                        className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs hover:bg-green-500/20 transition-all"
                      >
                        ✅ Confirmar Recebimento (dá entrada no estoque)
                      </button>
                    )}
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
          <div className="relative bg-gray-800 rounded-t-3xl sm:rounded-2xl border border-gray-700 p-6 w-full sm:max-w-lg mx-0 sm:mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">
                Novo Pedido de Compra
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Fornecedor *
                  </label>
                  <select
                    value={form.supplierId}
                    onChange={(e) =>
                      setForm({ ...form, supplierId: e.target.value })
                    }
                    className="w-full px-4 py-3 h-[49px] rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Selecione...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Previsão de entrega
                  </label>
                  <input
                    type="date"
                    value={form.expectedAt}
                    onChange={(e) =>
                      setForm({ ...form, expectedAt: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Itens do Pedido
                </label>
                <div className="space-y-2">
                  {orderItems.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-5">
                        <select
                          value={item.stockItemId}
                          onChange={(e) =>
                            updateItem(i, "stockItemId", e.target.value)
                          }
                          className="w-full px-3 py-2.5 h-[42px] rounded-xl bg-gray-700 border border-gray-600 text-white text-xs focus:outline-none focus:border-orange-500"
                        >
                          <option value="">Insumo...</option>
                          {stockItems.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.001"
                          placeholder="Qtd"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(i, "quantity", e.target.value)
                          }
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="R$/un"
                          value={item.costPerUnit}
                          onChange={(e) =>
                            updateItem(i, "costPerUnit", e.target.value)
                          }
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {orderItems.length > 1 && (
                          <button
                            onClick={() => removeItem(i)}
                            className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addItem}
                  className="w-full mt-2 py-2 rounded-xl border border-dashed border-gray-600 text-gray-400 text-xs hover:border-orange-500/50 hover:text-orange-400 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Item
                </button>
              </div>

              {totalOrder > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-gray-300">Total do pedido</span>
                  <span className="text-sm font-bold text-green-400">
                    R$ {totalOrder.toFixed(2)}
                  </span>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Observações
                </label>
                <input
                  placeholder="Notas sobre o pedido"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-gray-700">
              <Button
                variant="secondary"
                className="flex-1 bg-gray-700 border-gray-600 text-gray-300"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                icon={ShoppingCart}
                loading={saving}
                onClick={handleSave}
              >
                Criar Pedido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
