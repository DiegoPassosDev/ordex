"use client";

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
  Plus,
  Loader2,
} from "lucide-react";
import { CustomToaster } from "@/components/ui/Toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Header } from "@/components/layout/Header";
import { useEmployeesPage } from "./useEmployeesPage";
import { EmployeeFormModal } from "./EmployeeFormModal";

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
  const p = useEmployeesPage();

  return (
    <div className="flex h-screen bg-gray-900">
      <CustomToaster />
      <Sidebar items={navItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          <Header
            title=""
            subtitle="Gerencie a equipe do restaurante"
            restaurantId={p.restaurantId}
          />
          <div className="flex justify-end gap-3 mb-6">
            <Button
              icon={Plus}
              onClick={p.openAddModal}
              className="w-full sm:w-auto"
            >
              Novo Funcionário
            </Button>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-6 sm:mb-8">
            {Object.entries(p.byRole).map(([role, count]) => (
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

          {p.loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          )}

          {!p.loading && (
            <Card>
              <CardHeader className="flex-col items-start gap-1.5 sm:flex-row sm:items-center">
                <CardTitle>Todos os Funcionários</CardTitle>
                <span className="text-xs text-gray-400 sm:shrink-0">
                  {p.active} ativos de {p.employees.length}
                </span>
              </CardHeader>

              {p.employees.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Nenhum funcionário cadastrado
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {p.employees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => p.openEditModal(emp)}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                      emp.active
                        ? "bg-gray-800 border-gray-700 hover:border-orange-500/50"
                        : "bg-gray-800/50 border-gray-700/50 opacity-60 hover:border-orange-500/30"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        p.handleToggleActive(emp);
                      }}
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

      {p.showModal && (
        <EmployeeFormModal
          mode={p.modalMode}
          employee={p.editingEmployee}
          onSave={p.modalMode === "add" ? p.handleAdd : p.handleUpdate}
          onClose={p.closeModal}
          saving={p.saving}
        />
      )}
    </div>
  );
}
