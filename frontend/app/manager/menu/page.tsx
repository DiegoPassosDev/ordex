"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/auth.store";
import { menuService } from "@/services/menu.service";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  LayoutGrid,
  ClipboardList,
  Users,
  UtensilsCrossed,
  TrendingUp,
  Settings,
  ChefHat,
  Package,
  Plus,
  X,
  Bell,
  LogOut,
  Loader2,
  Eye,
  EyeOff,
  Power,
} from "lucide-react";
import { Category } from "@/types";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const navItems = [
  { href: "/manager", icon: LayoutGrid, label: "Dashboard" },
  { href: "/manager/tables", icon: UtensilsCrossed, label: "Mesas" },
  { href: "/manager/orders", icon: ClipboardList, label: "Pedidos" },
  { href: "/manager/menu", icon: ChefHat, label: "Cardápio" },
  { href: "/manager/employees", icon: Users, label: "Equipe" },
  { href: "/manager/stock", icon: Package, label: "Estoque" },
  { href: "/manager/reports", icon: TrendingUp, label: "Relatórios" },
  { href: "/manager/settings", icon: Settings, label: "Configurações" },
];

export default function MenuPage() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [savingCat, setSavingCat] = useState(false);
  const [savingEditItem, setSavingEditItem] = useState(false);

  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    prepTimeMin: "10",
    categoryId: "",
  });

  const [catForm, setCatForm] = useState({
    name: "",
    type: "FOOD",
  });

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    try {
      setLoading(true);
      const data = await menuService.getCategoriesByRestaurant(restaurantId);
      setCategories(data);
    } catch {
      toast.error("Erro ao carregar cardápio.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItem() {
    if (!itemForm.name || !itemForm.price || !itemForm.categoryId) {
      toast.error("Preencha nome, preço e categoria.");
      return;
    }
    setSavingItem(true);
    try {
      await api.post("/menu/items", {
        name: itemForm.name,
        description: itemForm.description || undefined,
        price: parseFloat(itemForm.price),
        prepTimeMin: parseInt(itemForm.prepTimeMin),
        categoryId: itemForm.categoryId,
      });
      toast.success("Item criado!");
      setShowItemModal(false);
      setItemForm({
        name: "",
        description: "",
        price: "",
        prepTimeMin: "10",
        categoryId: "",
      });
      loadMenu();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao criar item.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSavingItem(false);
    }
  }

  async function handleAddCategory() {
    if (!catForm.name) {
      toast.error("Informe o nome da categoria.");
      return;
    }
    setSavingCat(true);
    try {
      await api.post("/menu/categories", {
        name: catForm.name,
        type: catForm.type,
        restaurantId,
      });
      toast.success("Categoria criada!");
      setShowCatModal(false);
      setCatForm({ name: "", type: "FOOD" });
      loadMenu();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao criar categoria.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSavingCat(false);
    }
  }

  async function handleToggleItem(itemId: string) {
    try {
      await menuService.toggleItemAvailability(itemId);
      toast.success("Disponibilidade atualizada!");
      loadMenu();
    } catch {
      toast.error("Erro ao atualizar item.");
    }
  }

  async function handleEditItem(item: any) {
    setEditingItem({
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      prepTimeMin: item.prepTimeMin.toString(),
      categoryId: item.categoryId,
    });
    setShowEditModal(true);
  }

  async function handleSaveEditItem() {
    if (!editingItem.name || !editingItem.price) {
      toast.error("Preencha nome e preço.");
      return;
    }
    setSavingEditItem(true);
    try {
      await api.put(`/menu/items/${editingItem.id}`, {
        name: editingItem.name,
        description: editingItem.description || undefined,
        price: parseFloat(editingItem.price),
        prepTimeMin: parseInt(editingItem.prepTimeMin),
        categoryId: editingItem.categoryId,
      });
      toast.success("Item atualizado!");
      setShowEditModal(false);
      setEditingItem(null);
      loadMenu();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao atualizar item.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSavingEditItem(false);
    }
  }

  async function handleDeactivateItem(itemId: string) {
    try {
      await api.patch(`/menu/items/${itemId}/toggle`);
      toast.success("Disponibilidade atualizada!");
      loadMenu();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao atualizar disponibilidade.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  }

  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);
  const unavailableItems = categories.reduce(
    (acc, c) => acc + c.items.filter((i) => !i.available).length,
    0,
  );

  return (
    <div className="flex h-screen bg-gray-900">
      <Toaster position="top-right" />
      <Sidebar items={navItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Olá, {employee?.name?.split(" ")[0] || "Gestor"}!
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Gerencie o cardápio do restaurante
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-700 transition-all">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-orange-500 rounded-full" />
              </button>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                <span className="text-white font-semibold text-xs sm:text-sm">
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
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mb-6">
            <Button
              variant="secondary"
              icon={Plus}
              onClick={() => setShowCatModal(true)}
              className="w-full sm:w-40 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              Nova Categoria
            </Button>
            <Button icon={Plus} onClick={() => setShowItemModal(true)} className="w-full sm:w-40">
              Novo Item
            </Button>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 sm:p-5">
              <p className="text-2xl sm:text-3xl font-bold text-white">
                {categories.length}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Categorias</p>
            </div>
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 sm:p-5">
              <p className="text-2xl sm:text-3xl font-bold text-green-400">{totalItems}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Itens cadastrados</p>
            </div>
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 sm:p-5">
              <p className="text-2xl sm:text-3xl font-bold text-red-400">
                {unavailableItems}
              </p>
              <p className="text-sm text-gray-400 mt-1">Itens indisponíveis</p>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          )}

          {/* Categorias e Itens */}
          {!loading &&
            categories.map((cat) => (
              <Card key={cat.id} className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>{cat.name}</CardTitle>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                      {cat.type}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {cat.items.length} itens
                  </span>
                </CardHeader>

                {cat.items.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Nenhum item nesta categoria
                  </p>
                )}

                <div className="space-y-2">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border transition-all ${
                        item.available
                          ? "bg-gray-800 border-gray-700"
                          : "bg-gray-800/50 border-gray-700/50 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-100">
                              {item.name}
                            </p>
                            {!item.available && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                Indisponível
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5 break-words">
                              {item.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.prepTimeMin} min preparo
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto sm:ml-auto">
                        <p className="text-sm font-bold text-orange-400">
                          R$ {item.price.toFixed(2)}
                        </p>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-green-500/10 text-green-400 hover:bg-green-500/20"
                            title="Editar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {item.available && (
                            <button
                              onClick={() => handleDeactivateItem(item.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              title="Desativar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {!item.available && (
                            <button
                              onClick={() => handleDeactivateItem(item.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                              title="Ativar"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
        </div>
      </div>

      {/* Modal Novo Item */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowItemModal(false)}
          />
          <div className="relative bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">Novo Item</h3>
              <button onClick={() => setShowItemModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Categoria
                </label>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, categoryId: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="">Selecione...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Nome
                </label>
                <input
                  placeholder="Ex: Filé à Parmegiana"
                  value={itemForm.name}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Descrição
                </label>
                <input
                  placeholder="Descrição do item (opcional)"
                  value={itemForm.description}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, description: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={itemForm.price}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, price: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Tempo (min)
                  </label>
                  <input
                    type="number"
                    value={itemForm.prepTimeMin}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, prepTimeMin: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <Button
                  variant="secondary"
                  className="flex-1 bg-gray-700 border-gray-600 text-gray-300"
                  onClick={() => setShowItemModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  icon={Plus}
                  loading={savingItem}
                  onClick={handleAddItem}
                >
                  Criar Item
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowCatModal(false)}
          />
          <div className="relative bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">Nova Categoria</h3>
              <button onClick={() => setShowCatModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Nome
                </label>
                <input
                  placeholder="Ex: Entradas"
                  value={catForm.name}
                  onChange={(e) =>
                    setCatForm({ ...catForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Tipo
                </label>
                <select
                  value={catForm.type}
                  onChange={(e) =>
                    setCatForm({ ...catForm, type: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="FOOD">Comida</option>
                  <option value="DRINK">Bebida</option>
                  <option value="DESSERT">Sobremesa</option>
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <Button
                  variant="secondary"
                  className="flex-1 bg-gray-700 border-gray-600 text-gray-300"
                  onClick={() => setShowCatModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  icon={Plus}
                  loading={savingCat}
                  onClick={handleAddCategory}
                >
                  Criar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Item */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">Editar Item</h3>
              <button onClick={() => setShowEditModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Categoria
                </label>
                <select
                  value={editingItem.categoryId}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, categoryId: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="">Selecione...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Nome
                </label>
                <input
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Descrição
                </label>
                <input
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.price}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, price: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Tempo (min)
                  </label>
                  <input
                    type="number"
                    value={editingItem.prepTimeMin}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, prepTimeMin: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <Button
                  variant="secondary"
                  className="flex-1 bg-gray-700 border-gray-600 text-gray-300"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  loading={savingEditItem}
                  onClick={handleSaveEditItem}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
