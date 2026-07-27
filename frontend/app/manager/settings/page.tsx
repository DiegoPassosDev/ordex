"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
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
  Printer as PrinterIcon,
  LogOut,
  Loader2,
  Save,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { CustomToaster } from "@/components/ui/Toast";
import { Header } from "@/components/layout/Header";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";
import { useSettingsPage } from "./useSettingsPage";
import { maskCnpj, maskPhone, maskCep } from "@/lib/masks";

const navItems = [
  { href: "/manager", icon: LayoutGrid, label: "Dashboard" },
  { href: "/manager/tables", icon: UtensilsCrossed, label: "Mesas" },
  { href: "/manager/orders", icon: ClipboardList, label: "Pedidos" },
  { href: "/manager/menu", icon: ChefHat, label: "Cardápio" },
  { href: "/manager/employees", icon: Users, label: "Equipe" },
  { href: "/manager/stock", icon: Package, label: "Estoque" },
  { href: "/manager/printers", icon: PrinterIcon, label: "Impressoras" },
  { href: "/manager/reports", icon: TrendingUp, label: "Relatórios" },
  { href: "/manager/settings", icon: Settings, label: "Configurações" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { employee, clearAuth } = useAuthStore();
  const {
    form,
    setForm,
    loading,
    saving,
    loadingCep,
    restaurantId,
    handleSave,
    handleCepBlur,
    streetRef,
    numberRef,
  } = useSettingsPage();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="flex h-screen bg-gray-900">
      <CustomToaster />
      <Sidebar items={navItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
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
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                      Nome do Restaurante
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                        CNPJ
                      </label>
                      <input
                        value={form.cnpj}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            cnpj: maskCnpj(e.target.value),
                          })
                        }
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500 transition placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                        Telefone
                      </label>
                      <input
                        value={form.phone}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            phone: maskPhone(e.target.value),
                          })
                        }
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500 transition placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-300">
                        Endereço
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-1">
                          <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                            CEP
                          </label>
                          <input
                            value={form.zipCode}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                zipCode: maskCep(e.target.value),
                              })
                            }
                            onBlur={handleCepBlur}
                            placeholder="00000-000"
                            maxLength={9}
                            disabled={loadingCep}
                            className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500 transition placeholder:text-gray-500 disabled:opacity-50"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                            Logradouro
                          </label>
                          <input
                            ref={streetRef}
                            value={form.street}
                            onChange={(e) =>
                              setForm({ ...form, street: e.target.value })
                            }
                            placeholder="Rua, Avenida, etc."
                            className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500 transition placeholder:text-gray-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                            Número
                          </label>
                          <input
                            ref={numberRef}
                            value={form.number}
                            onChange={(e) =>
                              setForm({ ...form, number: e.target.value })
                            }
                            placeholder="Nº"
                            className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500 transition placeholder:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                            Bairro
                          </label>
                          <input
                            value={form.neighborhood}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                neighborhood: e.target.value,
                              })
                            }
                            placeholder="Bairro"
                            className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500 transition placeholder:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                            Cidade
                          </label>
                          <input
                            value={form.city}
                            onChange={(e) =>
                              setForm({ ...form, city: e.target.value })
                            }
                            placeholder="Cidade"
                            className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500 transition placeholder:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                            UF
                          </label>
                          <input
                            value={form.state}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                state: e.target.value
                                  .toUpperCase()
                                  .slice(0, 2),
                              })
                            }
                            placeholder="UF"
                            maxLength={2}
                            className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500 transition placeholder:text-gray-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
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
                    onClick={() => setShowLogoutModal(true)}
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
      <LogoutConfirmModal
        open={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={() => {
          clearAuth();
          router.push("/login");
        }}
      />
    </div>
  );
}
