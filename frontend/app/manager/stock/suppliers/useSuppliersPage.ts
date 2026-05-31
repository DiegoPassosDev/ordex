"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { RESTAURANT_ID_FALLBACK } from "@/constants";

export function useSuppliersPage() {
  const { employee } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || RESTAURANT_ID_FALLBACK;

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    document: "",
    notes: "",
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      setLoading(true);
      const { data } = await api.get(`/suppliers/restaurant/${restaurantId}`);
      setSuppliers(data);
    } catch {
      toast.error("Erro ao carregar fornecedores.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditItem(null);
    setForm({ name: "", phone: "", email: "", document: "", notes: "" });
    setShowModal(true);
  }

  function openEdit(s: any) {
    setEditItem(s);
    setForm({
      name: s.name,
      phone: s.phone || "",
      email: s.email || "",
      document: s.document || "",
      notes: s.notes || "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name) {
      toast.error("Informe o nome.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, restaurantId };
      if (editItem) {
        await api.patch(`/suppliers/${editItem.id}`, payload);
        toast.success("Fornecedor atualizado!");
      } else {
        await api.post("/suppliers", payload);
        toast.success("Fornecedor criado!");
      }
      setShowModal(false);
      loadSuppliers();
    } catch {
      toast.error("Erro ao salvar fornecedor.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover "${name}"?`)) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success("Fornecedor removido!");
      loadSuppliers();
    } catch {
      toast.error("Erro ao remover fornecedor.");
    }
  }

  return {
    suppliers,
    loading,
    showModal,
    setShowModal,
    saving,
    editItem,
    form,
    setForm,
    restaurantId,
    loadSuppliers,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  };
}
