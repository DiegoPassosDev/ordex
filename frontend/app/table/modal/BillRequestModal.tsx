"use client";

import { X, Loader2, Receipt, Minus, Plus } from "lucide-react";

interface BillRequestModalProps {
  orders: any[];
  serviceCharge: number;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  acceptService: boolean;
  setAcceptService: (v: boolean) => void;
  serviceChargeType: "PERCENTAGE" | "CUSTOM" | "NONE";
  setServiceChargeType: (v: "PERCENTAGE" | "CUSTOM" | "NONE") => void;
  customServiceChargeAmount: string;
  setCustomServiceChargeAmount: (v: string) => void;
  splitCount: number;
  setSplitCount: (v: number) => void;
  requesting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

type ServiceChargeOption = "PERCENTAGE" | "CUSTOM" | "NONE";

export function BillRequestModal({
  orders,
  serviceCharge,
  paymentMethod,
  setPaymentMethod,
  acceptService,
  setAcceptService,
  serviceChargeType,
  setServiceChargeType,
  customServiceChargeAmount,
  setCustomServiceChargeAmount,
  splitCount,
  setSplitCount,
  requesting,
  onConfirm,
  onClose,
}: BillRequestModalProps) {

  const groupedItems = (() => {
    const map = new Map<string, { name: string; quantity: number; price: number; notes?: string }>();
    for (const order of orders) {
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

  let serviceAmount = 0;
  if (serviceChargeType === "PERCENTAGE") {
    serviceAmount = subtotal * (serviceCharge / 100);
  } else if (serviceChargeType === "CUSTOM") {
    serviceAmount = parseFloat(customServiceChargeAmount) || 0;
  }

  const total = subtotal + serviceAmount;
  const perPerson = splitCount > 1 ? total / splitCount : total;

  const paymentOptions = [
    { value: "PIX", label: "PIX", emoji: "📱" },
    { value: "CREDIT", label: "Crédito", emoji: "💳" },
    { value: "DEBIT", label: "Débito", emoji: "💳" },
    { value: "CASH", label: "Dinheiro", emoji: "💵" },
  ];

  function handleSelectType(type: ServiceChargeOption) {
    setServiceChargeType(type);
    setAcceptService(type !== "NONE");
    if (type === "NONE") setCustomServiceChargeAmount("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto bg-gray-800 border-t border-gray-700 rounded-t-3xl p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg">Solicitar Conta</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Itens */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Itens</p>
          <div className="space-y-4">
            {groupedItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold shrink-0">
                  {item.quantity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{item.name}</p>
                  {item.notes && <p className="text-xs text-gray-500 italic">{item.notes}</p>}
                </div>
                <span className="text-sm text-gray-300 shrink-0">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divisão da conta */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Dividir conta
          </p>
          <div className="flex items-center gap-3 bg-gray-700/50 rounded-xl px-4 py-3">
            <button
              onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
              className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center text-white hover:bg-gray-500 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-white font-bold text-lg min-w-[2ch] text-center tabular-nums">
              {splitCount}
            </span>
            <button
              onClick={() => setSplitCount(Math.min(20, splitCount + 1))}
              className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-gray-400 text-sm ml-1">
              {splitCount === 1 ? "pessoa" : "pessoas"}
            </span>
            {splitCount > 1 && (
              <span className="ml-auto text-xs text-gray-500">
                R$ {perPerson.toFixed(2)} cada
              </span>
            )}
          </div>
        </div>

        {/* Taxa de serviço — 3 opções */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Taxa de serviço
          </p>
          <div className="space-y-2">
            <label
              onClick={() => handleSelectType("PERCENTAGE")}
              className={`flex items-center gap-3 px-4 min-h-[56px] rounded-xl border cursor-pointer transition-all ${
                serviceChargeType === "PERCENTAGE"
                  ? "bg-orange-500/10 border-orange-500/50"
                  : "bg-gray-700/50 border-gray-600 hover:border-gray-500"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  serviceChargeType === "PERCENTAGE"
                    ? "border-orange-400"
                    : "border-gray-500"
                }`}
              >
                {serviceChargeType === "PERCENTAGE" && (
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                )}
              </div>
              <span className="text-sm text-gray-200 flex-1">
                Taxa de {serviceCharge}%
              </span>
              <span className="text-sm text-gray-300">
                R$ {(subtotal * (serviceCharge / 100)).toFixed(2)}
              </span>
            </label>

            <label
              onClick={() => handleSelectType("CUSTOM")}
              className={`flex items-center gap-3 px-4 min-h-[56px] rounded-xl border cursor-pointer transition-all ${
                serviceChargeType === "CUSTOM"
                  ? "bg-orange-500/10 border-orange-500/50"
                  : "bg-gray-700/50 border-gray-600 hover:border-gray-500"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  serviceChargeType === "CUSTOM"
                    ? "border-orange-400"
                    : "border-gray-500"
                }`}
              >
                {serviceChargeType === "CUSTOM" && (
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                )}
              </div>
              <span className="text-sm text-gray-200 shrink-0">Outro valor</span>
              <div className="relative flex-1 max-w-[140px]">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={customServiceChargeAmount}
                  onChange={(e) => setCustomServiceChargeAmount(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500 placeholder:text-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </label>

            <label
              onClick={() => handleSelectType("NONE")}
              className={`flex items-center gap-3 px-4 min-h-[56px] rounded-xl border cursor-pointer transition-all ${
                serviceChargeType === "NONE"
                  ? "bg-orange-500/10 border-orange-500/50"
                  : "bg-gray-700/50 border-gray-600 hover:border-gray-500"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  serviceChargeType === "NONE"
                    ? "border-orange-400"
                    : "border-gray-500"
                }`}
              >
                {serviceChargeType === "NONE" && (
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                )}
              </div>
              <span className="text-sm text-gray-400">Sem taxa</span>
            </label>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-gray-700/50 rounded-2xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-white font-medium">R$ {subtotal.toFixed(2)}</span>
          </div>
          {serviceAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Taxa de serviço</span>
              <span className="text-gray-300">+ R$ {serviceAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-600 pt-2 flex justify-between items-center">
            <span className="font-semibold text-white">Total</span>
            <span className="font-bold text-orange-400 text-xl">
              R$ {total.toFixed(2)}
            </span>
          </div>
          {splitCount > 1 && (
            <div className="flex justify-between text-xs pt-1">
              <span className="text-gray-500">Valor por pessoa</span>
              <span className="text-gray-400 font-medium">
                R$ {perPerson.toFixed(2)} / pessoa
              </span>
            </div>
          )}
        </div>

        {/* Forma de pagamento */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-300 mb-3">Como prefere pagar?</p>
          <div className="grid grid-cols-2 gap-2">
            {paymentOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPaymentMethod(opt.value)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  paymentMethod === opt.value
                    ? "bg-orange-500/15 border-orange-500/50 text-orange-400"
                    : "bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500"
                }`}
              >
                <span className="text-base">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nota couvert */}
        <div className="mb-5 px-3 py-2.5 bg-gray-700/30 rounded-xl border border-gray-700 border-dashed">
          <p className="text-xs text-gray-500 text-center">
            🎵 Couvert artístico será exibido aqui quando disponível
          </p>
        </div>

        {/* Botão confirmar */}
        <button
          onClick={() => {
            setAcceptService(serviceChargeType !== "NONE");
            onConfirm();
          }}
          disabled={requesting || !paymentMethod}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm transition-all disabled:opacity-50"
        >
          {requesting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Receipt className="w-4 h-4" />
          )}
          {requesting ? "Solicitando..." : "Confirmar e chamar garçom"}
        </button>
      </div>
    </div>
  );
}
