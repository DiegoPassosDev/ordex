"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Printer, CategoryType } from "@/types";

interface PrinterRulesModalProps {
  printer: Printer;
  onAddRule: (printerId: string, categoryType: string) => Promise<void>;
  onRemoveRule: (printerId: string, ruleId: string) => Promise<void>;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<CategoryType, string> = {
  FOOD: "Food (Comida)",
  DRINK: "Drink (Bebida)",
  DESSERT: "Sobremesa",
};

const CATEGORY_COLORS: Record<CategoryType, string> = {
  FOOD: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  DRINK: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  DESSERT: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export function PrinterRulesModal({
  printer,
  onAddRule,
  onRemoveRule,
  onClose,
}: PrinterRulesModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("FOOD");

  const allCategories: CategoryType[] = ["FOOD", "DRINK", "DESSERT"];
  const availableCategories = allCategories.filter(
    (cat) => !printer.rules.some((r) => r.categoryType === cat),
  );

  async function handleAdd() {
    await onAddRule(printer.id, selectedCategory);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg">
            Regras — {printer.name}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Defina quais categorias devem imprimir nesta impressora.
        </p>

        {printer.rules.length > 0 && (
          <div className="space-y-2 mb-4">
            {printer.rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-700/50 border border-gray-600"
              >
                <span
                  className={`text-xs px-3 py-1 rounded-full border ${CATEGORY_COLORS[rule.categoryType]}`}
                >
                  {CATEGORY_LABELS[rule.categoryType]}
                </span>
                <button
                  onClick={() => onRemoveRule(printer.id, rule.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {printer.rules.length === 0 && (
          <div className="text-center py-6 mb-4">
            <p className="text-gray-500 text-sm">
              Nenhuma regra configurada
            </p>
          </div>
        )}

        {availableCategories.length > 0 && (
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CategoryType)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            <Button icon={Plus} onClick={handleAdd} className="px-4">
              Adicionar
            </Button>
          </div>
        )}

        <div className="flex justify-center mt-4">
          <Button
            variant="secondary"
            className="bg-gray-700 border-gray-600 text-gray-300"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
