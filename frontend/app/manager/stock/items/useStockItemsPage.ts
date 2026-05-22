"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export function useStockItemsPage() {
  const { employee } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    unit: "KG",
    minQuantity: "",
    costPerUnit: "",
    category: "",
  });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setLoading(true);
      const { data } = await api.get(`/stock/items/restaurant/${restaurantId}`);
      setItems(data);
    } catch {
      toast.error("Erro ao carregar insumos.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditItem(null);
    setForm({
      name: "",
      unit: "KG",
      minQuantity: "",
      costPerUnit: "",
      category: "",
    });
    setShowModal(true);
  }

  function openEdit(item: any) {
    setEditItem(item);
    setForm({
      name: item.name,
      unit: item.unit,
      minQuantity: String(item.minQuantity),
      costPerUnit: String(item.costPerUnit),
      category: item.category || "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name) {
      toast.error("Informe o nome do insumo.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        unit: form.unit,
        minQuantity: parseFloat(form.minQuantity) || 0,
        costPerUnit: parseFloat(form.costPerUnit) || 0,
        category: form.category || undefined,
        restaurantId,
      };
      if (editItem) {
        await api.patch(`/stock/items/${editItem.id}`, payload);
        toast.success("Insumo atualizado!");
      } else {
        await api.post("/stock/items", payload);
        toast.success("Insumo criado!");
      }
      setShowModal(false);
      loadItems();
    } catch {
      toast.error("Erro ao salvar insumo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover "${name}"?`)) return;
    try {
      await api.delete(`/stock/items/${id}`);
      toast.success("Insumo removido!");
      loadItems();
    } catch {
      toast.error("Erro ao remover insumo.");
    }
  }

  return {
    items,
    loading,
    showModal,
    setShowModal,
    saving,
    editItem,
    form,
    setForm,
    restaurantId,
    loadItems,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  };
}
