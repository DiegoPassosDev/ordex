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
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { Employee } from "@/types";
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

const ROLE_LABEL: Record<string, string> = {
  MANAGER: "Gestor",
  WAITER: "Garçom",
  KITCHEN: "Cozinha",
  BAR: "Bar",
  CASHIER: "Caixa",
};

const ROLE_COLOR: Record<string, string> = {
  MANAGER: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  WAITER: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  KITCHEN: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  BAR: "bg-green-500/20 text-green-400 border-green-500/30",
  CASHIER: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function EmployeesPage() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    pin: "",
    role: "WAITER",
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      const { data } = await api.get(`/employees/restaurant/${restaurantId}`);
      setEmployees(data);
    } catch {
      toast.error("Erro ao carregar equipe.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.name || !form.email || !form.password || !form.pin) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (form.pin.length < 4) {
      toast.error("PIN deve ter pelo menos 4 dígitos.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/employees", { ...form, restaurantId });
      toast.success("Funcionário cadastrado com sucesso!");
      setShowModal(false);
      setForm({ name: "", email: "", password: "", pin: "", role: "WAITER" });
      loadEmployees();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao cadastrar.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(emp: Employee) {
    try {
      await api.patch(`/employees/${emp.id}`, { active: !emp.active });
      toast.success(
        emp.active ? "Funcionário desativado." : "Funcionário ativado.",
      );
      loadEmployees();
    } catch {
      toast.error("Erro ao atualizar funcionário.");
    }
  }

  const active = employees.filter((e) => e.active).length;
  const byRole = {
    MANAGER: employees.filter((e) => e.role === "MANAGER").length,
    WAITER: employees.filter((e) => e.role === "WAITER").length,
    KITCHEN: employees.filter((e) => e.role === "KITCHEN").length,
    BAR: employees.filter((e) => e.role === "BAR").length,
    CASHIER: employees.filter((e) => e.role === "CASHIER").length,
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <CustomToaster />
      <Sidebar items={navItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          {/* Header */}
          <Header
            title=""
            subtitle="Gerencie a equipe do restaurante"
            restaurantId={restaurantId}
          />
          <div className="flex justify-end gap-3 mb-6">
            <Button
              icon={Plus}
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto"
            >
              Novo Funcionário
            </Button>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-5 gap-2 mb-6 sm:mb-8">
            {Object.entries(byRole).map(([role, count]) => (
              <div
                key={role}
                className="bg-gray-800 rounded-lg border border-gray-700 p-2.5 sm:p-3"
              >
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {count}
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                  {ROLE_LABEL[role]}
                </p>
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          )}

          {!loading && (
            <Card>
              <CardHeader className="flex-col items-start gap-1.5 sm:flex-row sm:items-center">
                <CardTitle>Todos os Funcionários</CardTitle>
                <span className="text-xs text-gray-400 sm:shrink-0">
                  {active} ativos de {employees.length}
                </span>
              </CardHeader>

              {employees.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Nenhum funcionário cadastrado
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all ${
                      emp.active
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-800/50 border-gray-700/50 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col gap-2 flex-1 min-w-0 w-full sm:flex-row sm:items-center sm:gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                          <span className="text-orange-400 font-bold text-sm">
                            {emp.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 sm:w-48 sm:shrink-0">
                          <p className="text-sm font-semibold text-gray-100 truncate">
                            {emp.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {emp.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs w-28 py-1 rounded-full border text-center ${ROLE_COLOR[emp.role]}`}
                        >
                          {ROLE_LABEL[emp.role]}
                        </span>
                        {!emp.active && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleActive(emp)}
                      className={`w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        emp.active
                          ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                          : "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
                      }`}
                    >
                      {emp.active ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">Novo Funcionário</h3>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Nome
                </label>
                <input
                  placeholder="Nome completo"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Senha
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    PIN
                  </label>
                  <input
                    type="password"
                    placeholder="4 dígitos"
                    maxLength={6}
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Função
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="WAITER">Garçom</option>
                  <option value="KITCHEN">Cozinha</option>
                  <option value="BAR">Bar</option>
                  <option value="CASHIER">Caixa</option>
                  <option value="MANAGER">Gestor</option>
                </select>
              </div>
              <div className="flex justify-center gap-3 mt-2">
                <Button
                  className="flex-1"
                  icon={Plus}
                  loading={saving}
                  onClick={handleAdd}
                >
                  Cadastrar
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 bg-gray-700 border-gray-600 text-gray-300"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
