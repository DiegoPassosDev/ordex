"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export function useRecipesPage() {
  const { employee } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [menuRes, stockRes] = await Promise.all([
        api.get(`/menu/items/restaurant/${restaurantId}`),
        api.get(`/stock/items/restaurant/${restaurantId}`),
      ]);
      setMenuItems(menuRes.data);
      setStockItems(stockRes.data);
    } catch {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  async function selectMenuItem(item: any) {
    setSelectedMenu(item);
    try {
      const { data } = await api.get(`/stock/recipes/${item.id}`);
      setIngredients(
        data.map((i: any) => ({
          stockItemId: i.stockItemId,
          quantity: String(i.quantity),
          unit: i.unit,
          name: i.stockItem?.name,
        })),
      );
    } catch {
      setIngredients([]);
    }
  }

  function addIngredient() {
    setIngredients([
      ...ingredients,
      { stockItemId: "", quantity: "", unit: "G" },
    ]);
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function updateIngredient(index: number, field: string, value: string) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "stockItemId") {
      const found = stockItems.find((s) => s.id === value);
      updated[index].name = found?.name;
      updated[index].unit =
        found?.unit === "KG"
          ? "G"
          : found?.unit === "L"
            ? "ML"
            : found?.unit || "G";
    }
    setIngredients(updated);
  }

  async function handleSave() {
    if (!selectedMenu) return;
    const valid = ingredients.every(
      (i) => i.stockItemId && parseFloat(i.quantity) > 0,
    );
    if (!valid) {
      toast.error("Preencha todos os ingredientes corretamente.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/stock/recipes/${selectedMenu.id}`, {
        ingredients: ingredients.map((i) => ({
          stockItemId: i.stockItemId,
          quantity: parseFloat(i.quantity),
          unit: i.unit,
        })),
      });
      toast.success("Receita salva!");
      selectMenuItem(selectedMenu);
    } catch {
      toast.error("Erro ao salvar receita.");
    } finally {
      setSaving(false);
    }
  }

  return {
    menuItems,
    stockItems,
    selectedMenu,
    ingredients,
    loading,
    saving,
    restaurantId,
    selectMenuItem,
    addIngredient,
    removeIngredient,
    updateIngredient,
    handleSave,
  };
}
