"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { Employee } from "@/types";

interface EmployeeFormModalProps {
  mode: "add" | "edit";
  employee?: Employee | null;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

export function EmployeeFormModal({
  mode,
  employee,
  onSave,
  onClose,
  saving,
}: EmployeeFormModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    pin: "",
    role: "WAITER",
  });

  useEffect(() => {
    if (mode === "edit" && employee) {
      setForm({
        name: employee.name,
        email: employee.email,
        password: "",
        pin: "",
        role: employee.role,
      });
    } else {
      setForm({ name: "", email: "", password: "", pin: "", role: "WAITER" });
    }
  }, [mode, employee]);

  async function handleSubmit() {
    if (!form.name || !form.email) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    if (mode === "add") {
      if (!form.password || !form.pin) {
        toast.error("Preencha senha e PIN.");
        return;
      }
      if (form.pin.length < 4) {
        toast.error("PIN deve ter pelo menos 4 dígitos.");
        return;
      }
      await onSave({
        name: form.name,
        email: form.email,
        password: form.password,
        pin: form.pin,
        role: form.role,
      });
    } else {
      await onSave({
        name: form.name,
        email: form.email,
        role: form.role,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg">
            {mode === "add" ? "Novo Funcionário" : "Editar Funcionário"}
          </h3>
          <button onClick={onClose}>
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
          {mode === "add" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Senha
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          )}
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
              loading={saving}
              onClick={handleSubmit}
            >
              {mode === "add" ? "Cadastrar" : "Salvar"}
            </Button>
            <Button
              variant="secondary"
              className="flex-1 bg-gray-700 border-gray-600 text-gray-300"
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
