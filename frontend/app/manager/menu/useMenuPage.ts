"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { menuService } from "@/services/menu.service";
import { api } from "@/lib/api";
import { Category } from "@/types";
import { toast } from "@/components/ui/Toast";
import { RESTAURANT_ID_FALLBACK } from "@/constants";

export function useMenuPage() {
  const { employee } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || RESTAURANT_ID_FALLBACK;

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
  const [searchQuery, setSearchQuery] = useState("");

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
      await api.patch(`/menu/items/${editingItem.id}`, {
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
      const msg =
        err?.response?.data?.message || "Erro ao atualizar disponibilidade.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  }

  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);
  const unavailableItems = categories.reduce(
    (acc, c) => acc + c.items.filter((i) => !i.available).length,
    0,
  );

  const filteredCategories = searchQuery
    ? categories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.description
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()),
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : categories;

  return {
    categories,
    loading,
    showItemModal,
    setShowItemModal,
    showCatModal,
    setShowCatModal,
    showEditModal,
    setShowEditModal,
    selectedCategoryId,
    setSelectedCategoryId,
    editingItem,
    savingItem,
    savingCat,
    savingEditItem,
    searchQuery,
    setSearchQuery,
    itemForm,
    setItemForm,
    catForm,
    setCatForm,
    restaurantId,
    totalItems,
    unavailableItems,
    filteredCategories,
    setEditingItem,
    loadMenu,
    handleAddItem,
    handleAddCategory,
    handleToggleItem,
    handleEditItem,
    handleSaveEditItem,
    handleDeactivateItem,
  };
}
