"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export function usePurchasesPage() {
  const { employee } = useAuthStore();
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

  return {
    orders,
    suppliers,
    stockItems,
    loading,
    showModal,
    setShowModal,
    saving,
    form,
    setForm,
    orderItems,
    restaurantId,
    totalOrder,
    loadAll,
    addItem,
    removeItem,
    updateItem,
    handleSave,
    handleStatus,
  };
}
