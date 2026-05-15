"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/auth.store";
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
  Bell,
  LogOut,
  Loader2,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CustomToaster, toast } from "@/components/ui/Toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Header } from "@/components/layout/Header";

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

export default function SettingsPage() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
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

  return (
    <div className="flex h-screen bg-gray-900">
      <CustomToaster />
      <Sidebar items={navItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          {/* Header */}
          <Header
            title="Configurações"
            subtitle="Configurações do restaurante"
            restaurantId={restaurantId}
          />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Restaurante</CardTitle>
                </CardHeader>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Nome do Restaurante
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Operação</CardTitle>
                </CardHeader>
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">
                      Taxa de Serviço Padrão
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Percentual sugerido ao cliente na hora do pagamento (pode
                      ser recusado)
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.serviceCharge}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            serviceCharge: Number(e.target.value),
                          })
                        }
                        className="w-24 px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                      <span className="text-gray-400 text-sm">%</span>
                      <span className="text-xs text-gray-500">
                        Ex: 10% sobre R$ 100,00 = R$ 10,00
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-5">
                    <label className="text-sm font-medium text-gray-300 mb-1 block">
                      Janela de Cancelamento
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Tempo que o cliente pode cancelar após confirmar
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={form.cancelWindowMin}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            cancelWindowMin: Number(e.target.value),
                          })
                        }
                        className="w-24 px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                      <span className="text-gray-400 text-sm">minutos</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-5">
                    <label className="text-sm font-medium text-gray-300 mb-1 block">
                      Tempo Limite para Aceite
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Se nenhum garçom aceitar, o gestor é notificado
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={form.acceptWindowMin}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            acceptWindowMin: Number(e.target.value),
                          })
                        }
                        className="w-24 px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                      <span className="text-gray-400 text-sm">minutos</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Minha Conta</CardTitle>
                </CardHeader>
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl">
                  <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">
                      {employee?.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {employee?.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {employee?.email}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 mt-1 inline-block">
                      Gestor
                    </span>
                  </div>
                </div>
              </Card>

              <Button
                icon={Save}
                size="lg"
                className="w-full"
                loading={saving}
                onClick={handleSave}
              >
                Salvar Configurações
              </Button>

              <Card>
                <CardHeader>
                  <CardTitle>Zona de Perigo</CardTitle>
                </CardHeader>
                <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl gap-3">
                  <div>
                    <p className="text-sm font-medium text-red-400">
                      Sair do Sistema
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Encerra sua sessão atual
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      clearAuth();
                      router.push("/login");
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
