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
  Plus,
  Loader2,
  Printer as PrinterIcon,
  Link,
  Wifi,
} from "lucide-react";
import { CustomToaster } from "@/components/ui/Toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Header } from "@/components/layout/Header";
import { usePrintersPage } from "./usePrintersPage";
import { PrinterFormModal } from "./PrinterFormModal";
import { PrinterRulesModal } from "./PrinterRulesModal";


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

const LOCATION_LABEL: Record<string, string> = {
  COZINHA: "Cozinha",
  BAR: "Bar",
  CAIXA: "Caixa",
};

const LOCATION_COLOR: Record<string, string> = {
  COZINHA: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  BAR: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CAIXA: "bg-green-500/20 text-green-400 border-green-500/30",
};

const CATEGORY_LABEL: Record<string, string> = {
  FOOD: "Food",
  DRINK: "Drink",
  DESSERT: "Sobremesa",
};

export default function PrintersPage() {
  useRequireAuth("MANAGER");
  const p = usePrintersPage();
  const [rulesPrinterId, setRulesPrinterId] = useState<string | null>(null);

  const rulesPrinter = rulesPrinterId
    ? p.printers.find((pr) => pr.id === rulesPrinterId) ?? null
    : null;

  return (
    <div className="flex h-screen bg-gray-900">
      <CustomToaster />
      <Sidebar items={navItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          <Header
            title="Impressoras"
            subtitle="Configure impressoras e regras de impressão"
            restaurantId={p.restaurantId}
          />
          <div className="flex justify-end gap-3 mb-6">
            <Button
              icon={Plus}
              onClick={p.openAddModal}
              className="w-full sm:w-auto"
            >
              Nova Impressora
            </Button>
          </div>

          {p.loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          )}

          {!p.loading && (
            <Card>
              <CardHeader className="flex-col items-start gap-1.5 sm:flex-row sm:items-center">
                <CardTitle>Impressoras Cadastradas</CardTitle>
                <span className="text-xs text-gray-400 sm:shrink-0">
                  {p.printers.length} impressora(s)
                </span>
              </CardHeader>

              {p.printers.length === 0 && (
                <div className="text-center py-12">
                  <PrinterIcon className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Nenhuma impressora cadastrada
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {p.printers.map((printer) => (
                  <div
                    key={printer.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all ${
                      printer.active
                        ? "bg-gray-800 border-gray-700 hover:border-orange-500/50"
                        : "bg-gray-800/50 border-gray-700/50 opacity-60 hover:border-orange-500/30"
                    }`}
                  >
                    <div className="flex flex-col gap-2 flex-1 min-w-0 w-full sm:flex-row sm:items-center sm:gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                          <PrinterIcon className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-100 truncate">
                            {printer.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Wifi className="w-3 h-3 text-gray-500" />
                            <p className="text-xs text-gray-400">
                              {printer.ip}:{printer.port}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${LOCATION_COLOR[printer.location] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                        >
                          {LOCATION_LABEL[printer.location] || printer.location}
                        </span>
                        {printer.rules.length > 0 && (
                          <div className="flex gap-1">
                            {printer.rules.map((rule) => (
                              <span
                                key={rule.id}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 border border-gray-600"
                              >
                                {CATEGORY_LABEL[rule.categoryType] || rule.categoryType}
                              </span>
                            ))}
                          </div>
                        )}
                        {!printer.active && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setRulesPrinterId(printer.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 transition-all"
                        title="Configurar regras"
                      >
                        <Link className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => p.openEditModal(printer)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 transition-all"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => p.handleToggleActive(printer)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          printer.active
                            ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                            : "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
                        }`}
                      >
                        {printer.active ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {p.showModal && (
        <PrinterFormModal
          mode={p.modalMode}
          printer={p.editingPrinter}
          onSave={p.modalMode === "add" ? p.handleAdd : p.handleUpdate}
          onClose={p.closeModal}
          saving={p.saving}
        />
      )}

      {rulesPrinter && (
        <PrinterRulesModal
          printer={rulesPrinter}
          onAddRule={p.handleAddRule}
          onRemoveRule={p.handleRemoveRule}
          onClose={() => setRulesPrinterId(null)}
        />
      )}
    </div>
  );
}
