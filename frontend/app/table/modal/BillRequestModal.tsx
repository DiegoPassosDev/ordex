"use client";

import { X, Loader2, Receipt, CheckCheck } from "lucide-react";

interface BillRequestModalProps {
  orders: any[];
  serviceCharge: number; // ex: 10 (%)
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  acceptService: boolean;
  setAcceptService: (v: boolean) => void;
  requesting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function BillRequestModal({
  orders,
  serviceCharge,
  paymentMethod,
  setPaymentMethod,
  acceptService,
  setAcceptService,
  requesting,
  onConfirm,
  onClose,
}: BillRequestModalProps) {
  // Calcula subtotal dos pedidos não cancelados
  const subtotal = orders.reduce((acc, order) => {
    if (order.status === "CANCELLED") return acc;
    return (
      acc +
      order.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)
    );
  }, 0);

  const serviceAmount = acceptService ? subtotal * (serviceCharge / 100) : 0;

  const total = subtotal + serviceAmount;

  const paymentOptions = [
    { value: "PIX", label: "PIX", emoji: "📱" },
    { value: "CREDIT", label: "Crédito", emoji: "💳" },
    { value: "DEBIT", label: "Débito", emoji: "💳" },
    { value: "CASH", label: "Dinheiro", emoji: "💵" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto bg-gray-800 border-t border-gray-700 rounded-t-3xl p-6 max-h-[90vh] overflow-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg">Solicitar Conta</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Resumo dos valores */}
        <div className="bg-gray-700/50 rounded-2xl p-4 mb-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-white font-medium">
              R$ {subtotal.toFixed(2)}
            </span>
          </div>

          {/* Toggle taxa de serviço */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">
                  Taxa de serviço ({serviceCharge}%)
                </p>
                <p className="text-xs text-gray-500">Opcional</p>
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => setAcceptService(!acceptService)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
                  acceptService ? "bg-orange-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full shadow transition-transform duration-200 ${
                    acceptService ? "translate-x-[20px]" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            {acceptService && (
              <div className="flex justify-end">
                <span className="text-sm text-gray-300">
                  + R$ {serviceAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="border-t border-gray-600 pt-3 flex justify-between items-center">
            <span className="font-semibold text-white">Total</span>
            <span className="font-bold text-orange-400 text-xl">
              R$ {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Forma de pagamento preferida */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-300 mb-3">
            Como prefere pagar?
          </p>
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

        {/* Nota sobre couvert (placeholder para implementação futura) */}
        <div className="mb-5 px-3 py-2.5 bg-gray-700/30 rounded-xl border border-gray-700 border-dashed">
          <p className="text-xs text-gray-500 text-center">
            🎵 Couvert artístico será exibido aqui quando disponível
          </p>
        </div>

        {/* Botão confirmar */}
        <button
          onClick={onConfirm}
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
