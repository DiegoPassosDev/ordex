"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Printer } from "@/types";
import { toast } from "@/components/ui/Toast";
import { RESTAURANT_ID_FALLBACK } from "@/constants";

const RESTAURANT_FALLBACK = RESTAURANT_ID_FALLBACK;

export function usePrintersPage() {
  const { employee } = useAuthStore();
  const restaurantId = employee?.restaurantId || RESTAURANT_FALLBACK;

  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);

  const loadPrinters = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/printers/restaurant/${restaurantId}`);
      setPrinters(data);
    } catch {
      toast.error("Erro ao carregar impressoras.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  async function handleAdd(data: {
    name: string;
    ip: string;
    port: number;
    location: string;
  }) {
    setSaving(true);
    try {
      await api.post("/printers", { ...data, restaurantId });
      toast.success("Impressora cadastrada com sucesso!");
      setShowModal(false);
      loadPrinters();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao cadastrar.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: {
    name: string;
    ip: string;
    port: number;
    location: string;
  }) {
    if (!editingPrinter) return;
    setSaving(true);
    try {
      await api.patch(`/printers/${editingPrinter.id}`, data);
      toast.success("Impressora atualizada com sucesso!");
      setShowModal(false);
      setEditingPrinter(null);
      loadPrinters();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao atualizar.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(printer: Printer) {
    try {
      await api.patch(`/printers/${printer.id}`, { active: !printer.active });
      toast.success(
        printer.active ? "Impressora desativada." : "Impressora ativada.",
      );
      loadPrinters();
    } catch {
      toast.error("Erro ao atualizar impressora.");
    }
  }

  async function handleAddRule(printerId: string, categoryType: string) {
    try {
      await api.post(`/printers/${printerId}/rules`, { categoryType });
      toast.success("Regra adicionada!");
      await loadPrinters();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao adicionar regra.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  }

  async function handleRemoveRule(printerId: string, ruleId: string) {
    try {
      await api.delete(`/printers/${printerId}/rules/${ruleId}`);
      toast.success("Regra removida!");
      await loadPrinters();
    } catch {
      toast.error("Erro ao remover regra.");
    }
  }

  function openAddModal() {
    setEditingPrinter(null);
    setShowModal(true);
  }

  function openEditModal(printer: Printer) {
    setEditingPrinter(printer);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPrinter(null);
  }

  return {
    printers,
    loading,
    saving,
    showModal,
    editingPrinter,
    modalMode: editingPrinter ? "edit" as const : "add" as const,
    restaurantId,
    loadPrinters,
    handleAdd,
    handleUpdate,
    handleToggleActive,
    handleAddRule,
    handleRemoveRule,
    openAddModal,
    openEditModal,
    closeModal,
  };
}
