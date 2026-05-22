"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export function useSettingsPage() {
  const { employee, clearAuth } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    serviceCharge: 10,
    cancelWindowMin: 3,
    acceptWindowMin: 2,
  });

  useEffect(() => {
    loadRestaurant();
  }, []);

  async function loadRestaurant() {
    try {
      setLoading(true);
      const { data } = await api.get(`/restaurants/${restaurantId}`);
      setForm({
        name: data.name,
        serviceCharge: data.serviceCharge,
        cancelWindowMin: data.cancelWindowMin,
        acceptWindowMin: data.acceptWindowMin,
      });
    } catch {
      toast.error("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch(`/restaurants/${restaurantId}`, form);
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }

  return {
    form,
    setForm,
    loading,
    saving,
    restaurantId,
    employee,
    clearAuth,
    handleSave,
  };
}
