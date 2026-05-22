"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export function useEntriesPage() {
  const { employee } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [groups, setGroups] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({ supplierId: "", note: "" });
  const [entryItems, setEntryItems] = useState([
    { stockItemId: "", quantity: "", costPerUnit: "" },
  ]);

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
      setGroups(entriesRes.data);
      setStockItems(itemsRes.data);
      setSuppliers(suppliersRes.data);
    } catch {
      toast.error("Erro ao carregar entradas.");
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setForm({ supplierId: "", note: "" });
    setEntryItems([{ stockItemId: "", quantity: "", costPerUnit: "" }]);
    setEditingEntryId(null);
    setShowModal(true);
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

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

  function handleEditEntry(entry: any) {
    setForm({
      supplierId: entry.supplier?.id || "",
      note: entry.note || "",
    });
    setEntryItems([
      {
        stockItemId: entry.stockItem?.id || "",
        quantity: entry.quantity.toString(),
        costPerUnit: entry.costPerUnit.toString(),
      },
    ]);
    setEditingEntryId(entry.id);
    setShowModal(true);
  }

  function requestDelete(item: any) {
    setDeleteTarget({
      id: item.id,
      name: item.stockItem?.name ?? "esta entrada",
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/stock/entries/${deleteTarget.id}`);
      toast.success("Entrada excluída e estoque revertido!");
      setDeleteTarget(null);
      loadAll();
    } catch {
      toast.error("Erro ao excluir entrada.");
    } finally {
      setDeleting(false);
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
      if (editingEntryId) {
        const item = entryItems[0];
        await api.patch(`/stock/entries/${editingEntryId}`, {
          stockItemId: item.stockItemId,
          supplierId: form.supplierId || undefined,
          quantity: parseFloat(item.quantity),
          costPerUnit: parseFloat(item.costPerUnit),
          note: form.note || undefined,
        });
        toast.success("Entrada atualizada!");
      } else {
        await api.post("/stock/entries", {
          restaurantId,
          supplierId: form.supplierId || undefined,
          note: form.note || undefined,
          items: entryItems.map((i) => ({
            stockItemId: i.stockItemId,
            quantity: parseFloat(i.quantity),
            costPerUnit: parseFloat(i.costPerUnit),
          })),
        });
        toast.success(`${entryItems.length} entrada(s) registrada(s)!`);
      }

      setShowModal(false);
      setEditingEntryId(null);
      setForm({ supplierId: "", note: "" });
      setEntryItems([{ stockItemId: "", quantity: "", costPerUnit: "" }]);
      loadAll();
    } catch {
      toast.error("Erro ao salvar entrada.");
    } finally {
      setSaving(false);
    }
  }

  const totalGeral = entryItems.reduce(
    (acc, i) =>
      acc + (parseFloat(i.quantity) || 0) * (parseFloat(i.costPerUnit) || 0),
    0,
  );

  return {
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
    restaurantId,
    totalGeral,
    loadAll,
    openModal,
    toggleGroup,
    addEntryItem,
    removeEntryItem,
    updateEntryItem,
    handleEditEntry,
    requestDelete,
    confirmDelete,
    handleSave,
  };
}
