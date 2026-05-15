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
  Phone,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Header } from "@/components/layout/Header";

export default function SuppliersPage() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

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

  return (
    <div className="flex h-screen bg-gray-900">
      <Toaster position="top-center" />
      <Sidebar items={managerNavItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          <div className="flex items-start gap-4 mb-1">
            {/* Seta */}
            <Link
              href="/manager/stock"
              className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            {/* Header ocupa toda largura restante */}
            <div className="flex-1 min-w-0">
              <Header
                title="Fornecedores"
                subtitle="Gerencie seus fornecedores"
                restaurantId={restaurantId}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Todos os Fornecedores</CardTitle>
                <span className="text-xs text-gray-400">
                  {suppliers.length} cadastrados
                </span>
              </CardHeader>

              {suppliers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">
                    Nenhum fornecedor cadastrado
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {suppliers.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-gray-800 border border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-100">
                          {s.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {s.phone && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Phone className="w-3 h-3" />
                              {s.phone}
                            </span>
                          )}
                          {s.email && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Mail className="w-3 h-3" />
                              {s.email}
                            </span>
                          )}
                          {s.document && (
                            <span className="text-xs text-gray-500">
                              CNPJ: {s.document}
                            </span>
                          )}
                        </div>
                        {s.notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            {s.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openEdit(s)}
                          className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-xs hover:bg-gray-600 transition-all"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-gray-800 rounded-t-3xl sm:rounded-2xl border border-gray-700 p-6 w-full sm:max-w-md mx-0 sm:mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">
                {editItem ? "Editar Fornecedor" : "Novo Fornecedor"}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Nome *
                </label>
                <input
                  placeholder="Nome do fornecedor"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Telefone
                  </label>
                  <input
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    CNPJ
                  </label>
                  <input
                    placeholder="00.000.000/0001-00"
                    value={form.document}
                    onChange={(e) =>
                      setForm({ ...form, document: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="contato@fornecedor.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Observações
                </label>
                <input
                  placeholder="Notas sobre o fornecedor"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex justify-center gap-3 mt-2">
                <Button
                  variant="secondary"
                  className="flex-1 bg-gray-700 border-gray-600 text-gray-300"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  loading={saving}
                  onClick={handleSave}
                >
                  {editItem ? "Salvar" : "Criar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
