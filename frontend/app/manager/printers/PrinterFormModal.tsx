"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { Printer } from "@/types";

interface PrinterFormModalProps {
  mode: "add" | "edit";
  printer?: Printer | null;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

export function PrinterFormModal({
  mode,
  printer,
  onSave,
  onClose,
  saving,
}: PrinterFormModalProps) {
  const [form, setForm] = useState({
    name: "",
    ip: "",
    port: 9100,
    location: "COZINHA",
  });

  useEffect(() => {
    if (mode === "edit" && printer) {
      setForm({
        name: printer.name,
        ip: printer.ip,
        port: printer.port,
        location: printer.location,
      });
    } else {
      setForm({ name: "", ip: "", port: 9100, location: "COZINHA" });
    }
  }, [mode, printer]);

  async function handleSubmit() {
    if (!form.name || !form.ip) {
      toast.error("Preencha nome e IP.");
      return;
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(form.ip)) {
      toast.error("Formato de IP inválido.");
      return;
    }

    if (!Number.isInteger(form.port) || form.port < 1 || form.port > 65535) {
      toast.error("Porta deve ser um número entre 1 e 65535.");
      return;
    }

    const validLocations = ["COZINHA", "BAR", "CAIXA"];
    if (!validLocations.includes(form.location)) {
      toast.error("Localização inválida.");
      return;
    }

    await onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg">
            {mode === "add" ? "Nova Impressora" : "Editar Impressora"}
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
              placeholder="Ex: Cozinha Principal"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">
              IP da Impressora
            </label>
            <input
              placeholder="192.168.1.100"
              value={form.ip}
              onChange={(e) => setForm({ ...form, ip: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">
              Porta
            </label>
            <input
              type="number"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">
              Localização
            </label>
            <select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="COZINHA">Cozinha</option>
              <option value="BAR">Bar</option>
              <option value="CAIXA">Caixa</option>
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
