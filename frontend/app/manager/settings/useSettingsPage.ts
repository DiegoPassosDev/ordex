"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { RESTAURANT_ID_FALLBACK } from "@/constants";
import { unmask } from "@/lib/masks";
import { fetchAddressByCep } from "@/lib/viacep";

export function useSettingsPage() {
  const { employee, clearAuth } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || RESTAURANT_ID_FALLBACK;

  const streetRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    phone: "",
    zipCode: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    serviceCharge: 10,
    cancelWindowMin: 3,
    acceptWindowMin: 2,
  });

  const loadRestaurant = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/restaurants/${restaurantId}`);
      setForm({
        name: data.name,
        cnpj: data.cnpj || "",
        phone: data.phone || "",
        zipCode: data.zipCode || "",
        street: data.street || "",
        number: data.number || "",
        neighborhood: data.neighborhood || "",
        city: data.city || "",
        state: data.state || "",
        serviceCharge: data.serviceCharge,
        cancelWindowMin: data.cancelWindowMin,
        acceptWindowMin: data.acceptWindowMin,
      });
    } catch {
      toast.error("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  const handleCepBlur = useCallback(async () => {
    const cepDigits = unmask(form.zipCode);
    if (cepDigits.length !== 8) return;

    setLoadingCep(true);
    try {
      const addressData = await fetchAddressByCep(form.zipCode);
      if (addressData) {
        setForm((prev) => ({
          ...prev,
          street: addressData.street,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state,
        }));

        if (addressData.street) {
          numberRef.current?.focus();
        } else {
          streetRef.current?.focus();
        }
      } else {
        toast.error("CEP não encontrado.");
      }
    } catch {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setLoadingCep(false);
    }
  }, [form.zipCode]);

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
    loadingCep,
    restaurantId,
    employee,
    clearAuth,
    handleSave,
    handleCepBlur,
    streetRef,
    numberRef,
  };
}
