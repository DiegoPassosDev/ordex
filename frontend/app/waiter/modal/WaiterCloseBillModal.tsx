"use client";

import { useState } from "react";
import { X, DollarSign, Smartphone, CreditCard, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { TableSession } from "@/types";
import { sessionsService } from "@/services/sessions.service";

const METHODS = [
  { value: "CASH", label: "Dinheiro", icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  { value: "PIX", label: "Pix", icon: Smartphone, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  { value: "DEBIT", label: "Débito", icon: CreditCard, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  { value: "CREDIT", label: "Crédito", icon: CreditCard, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30" },
];

interface WaiterCloseBillModalProps {
  session: TableSession;
  onClose: () => void;
  onSuccess: () => void;
}

export function WaiterCloseBillModal({ session, onClose, onSuccess }: WaiterCloseBillModalProps) {
  const [method, setMethod] = useState("CASH");
  const [serviceChargeAccepted, setServiceChargeAccepted] = useState(true);
  const [saving, setSaving] = useState(false);

  const groupedItems = (() => {
    const map = new Map<string, { name: string; quantity: number; price: number; notes?: string }>();
    for (const order of session.orders ?? []) {
      if (order.status === "CANCELLED") continue;
      for (const item of order.items) {
        const key = `${item.menuItemId ?? item.menuItem?.id}-${item.price}-${item.notes ?? ""}`;
        const existing = map.get(key);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          map.set(key, {
            name: item.menuItem?.name ?? "",
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
          });
        }
      }
    }
    return Array.from(map.values());
  })();

  const subtotal = groupedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

  const serviceCharge = serviceChargeAccepted ? subtotal * 0.1 : 0;
  const total = subtotal + serviceCharge;

  async function handleConfirm() {
    setSaving(true);
    try {
      await sessionsService.requestBill(session.id, {
        preferredPaymentMethod: method as any,
        serviceChargeAccepted,
      });
      toast.success("Conta solicitada com sucesso!");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao solicitar conta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto bg-gray-800 border-t border-gray-700 rounded-t-3xl p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg">
            Fechamento — Mesa {session.table?.number}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Itens do pedido */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Itens
          </p>
          <div className="space-y-3">
            {groupedItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold shrink-0">
                  {item.quantity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">
                    {item.name}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-gray-500 italic">
                      {item.notes}
                    </p>
                  )}
                </div>
                <span className="text-sm text-gray-300 shrink-0">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Forma de Pagamento
        </p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {METHODS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  method === m.value
                    ? `${m.bg} ${m.border} ${m.color}`
                    : "bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="bg-gray-700/50 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Subtotal</span>
            <span className="text-sm text-white">R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Taxa de serviço (10%)</span>
              <button
                onClick={() => setServiceChargeAccepted(!serviceChargeAccepted)}
                className={`relative w-10 h-5 rounded-full transition-all ${
                  serviceChargeAccepted ? "bg-orange-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    serviceChargeAccepted ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <span className="text-sm text-white">
              {serviceChargeAccepted ? `R$ ${serviceCharge.toFixed(2)}` : "R$ 0,00"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-600">
            <span className="text-base font-bold text-white">Total</span>
            <span className="text-base font-bold text-green-400">R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={saving}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 transition-all"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <DollarSign className="w-4 h-4" />
          )}
          Solicitar Conta — R$ {total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
