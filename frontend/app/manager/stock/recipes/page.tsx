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
  ChefHat,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const UNITS = ["G", "KG", "ML", "L", "UN"];
const UNIT_LABEL: Record<string, string> = {
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
  UN: "un",
};

export default function RecipesPage() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
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

  return (
    <div className="flex h-screen bg-gray-900">
      <Toaster position="top-right" />
      <Sidebar items={managerNavItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/manager/stock"
                className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Receitas dos Pratos
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Defina os ingredientes de cada prato
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

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de pratos */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Pratos do Cardápio</CardTitle>
                    <span className="text-xs text-gray-400">
                      {menuItems.length} itens
                    </span>
                  </CardHeader>
                  <div className="space-y-2">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => selectMenuItem(item)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          selectedMenu?.id === item.id
                            ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{item.name}</p>
                          <span className="text-xs text-gray-500">
                            R$ {item.price.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Editor de receita */}
              <div className="lg:col-span-2">
                {!selectedMenu ? (
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl flex flex-col items-center justify-center py-20">
                    <ChefHat className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="text-gray-500 text-sm">
                      Selecione um prato para editar a receita
                    </p>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Receita — {selectedMenu.name}</CardTitle>
                      <span className="text-xs text-gray-400">
                        Preço: R$ {selectedMenu.price.toFixed(2)}
                      </span>
                    </CardHeader>

                    <div className="space-y-3 mb-4">
                      {ingredients.map((ing, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-12 gap-2 items-center"
                        >
                          <div className="col-span-5">
                            <select
                              value={ing.stockItemId}
                              onChange={(e) =>
                                updateIngredient(
                                  i,
                                  "stockItemId",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
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
                              step="0.1"
                              placeholder="Qtd"
                              value={ing.quantity}
                              onChange={(e) =>
                                updateIngredient(i, "quantity", e.target.value)
                              }
                              className="w-full px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                            />
                          </div>
                          <div className="col-span-3">
                            <select
                              value={ing.unit}
                              onChange={(e) =>
                                updateIngredient(i, "unit", e.target.value)
                              }
                              className="w-full px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                            >
                              {UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <button
                              onClick={() => removeIngredient(i)}
                              className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addIngredient}
                      className="w-full py-2.5 rounded-xl border border-dashed border-gray-600 text-gray-400 text-sm hover:border-orange-500/50 hover:text-orange-400 transition-all flex items-center justify-center gap-2 mb-4"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Ingrediente
                    </button>

                    <Button
                      icon={Save}
                      className="w-full"
                      loading={saving}
                      onClick={handleSave}
                    >
                      Salvar Receita
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
