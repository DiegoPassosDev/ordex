"use client";

import {
  DollarSign,
  CreditCard,
  Smartphone,
  Receipt,
  AlertCircle,
  CheckCheck,
  Loader2,
  ChevronRight,
  X,
  Bell,
  LogOut,
  Wallet,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeProvider";
import { CustomToaster } from "@/components/ui/Toast";
import { useCashierPage, METHOD_LABEL } from "./useCashierPage";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Dinheiro", icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  { value: "PIX", label: "Pix", icon: Smartphone, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  { value: "DEBIT", label: "Débito", icon: CreditCard, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  { value: "CREDIT", label: "Crédito", icon: CreditCard, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30" },
  { value: "VOUCHER", label: "Vale Refeição", icon: Receipt, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  { value: "CHECK", label: "Cheque", icon: Receipt, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  { value: "STORE_CREDIT", label: "Crédito do Cliente", icon: Wallet, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
];

export default function CashierPage() {
  const p = useCashierPage();

  return (
    <div className="min-h-screen bg-gray-900">
      <CustomToaster />

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Caixa — Ordex</p>
              <p className="text-xs text-gray-400">{p.employee?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {p.billSessions.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                <Bell className="w-3.5 h-3.5" />
                {p.billSessions.length} conta(s)
              </div>
            )}
            <div className="flex items-center">
              <ThemeToggle />
            </div>
            <button
              onClick={p.handleLogout}
              className="w-9 h-9 rounded-xl bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto mt-3 flex gap-1 bg-gray-700/50 rounded-xl p-1">
          {[
            { key: "sessions", label: "Mesas", count: p.sessions.length },
            { key: "debts", label: "Créditos", count: p.debts.length },
            { key: "report", label: "Relatório" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => p.setTab(t.key as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                p.tab === t.key ? "bg-gray-600 text-white" : "text-gray-400"
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    p.tab === t.key
                      ? "bg-orange-500 text-white"
                      : "bg-gray-600 text-gray-300"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {p.loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}

        {/* Tab Mesas */}
        {!p.loading && p.tab === "sessions" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de mesas */}
            <div className="space-y-3">
              {p.billSessions.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Pedindo Conta
                  </p>
                  {p.billSessions.map((session: any) => {
                    const total = p.getSessionTotal(session);
                    return (
                      <div
                        key={session.id}
                        onClick={() => p.handleSelectSession(session)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          p.selectedSession?.id === session.id
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-red-500/50 bg-red-500/5 hover:border-red-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                              <span className="text-red-400 font-bold">
                                {session.table?.number}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                Mesa {session.table?.number}
                              </p>
                              <p className="text-xs text-gray-400">
                                {session.waiter?.name || "Sem garçom"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-400">
                              R$ {total.toFixed(2)}
                            </p>
                            <ChevronRight className="w-4 h-4 text-gray-500 ml-auto mt-0.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {p.openSessions.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                    Mesas Abertas
                  </p>
                  {p.openSessions.map((session: any) => {
                    const total = p.getSessionTotal(session);
                    return (
                      <div
                        key={session.id}
                        onClick={() => p.handleSelectSession(session)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          p.selectedSession?.id === session.id
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-gray-700 bg-gray-800 hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-300 font-bold">
                                {session.table?.number}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                Mesa {session.table?.number}
                              </p>
                              <p className="text-xs text-gray-400">
                                {session.waiter?.name || "Sem garçom"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-300">
                              R$ {total.toFixed(2)}
                            </p>
                            <ChevronRight className="w-4 h-4 text-gray-500 ml-auto mt-0.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {p.sessions.length === 0 && (
                <div className="text-center py-16">
                  <CheckCheck className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Nenhuma mesa ativa</p>
                </div>
              )}
            </div>

            {/* Painel de pagamento */}
            <div>
              {!p.selectedSession ? (
                <div className="bg-gray-800 border border-gray-700 rounded-2xl flex flex-col items-center justify-center py-20">
                  <Receipt className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-gray-500 text-sm">
                    Selecione uma mesa para registrar o pagamento
                  </p>
                </div>
              ) : p.loadingBill ? (
                <div className="bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
              ) : (
                p.billData && (
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                    {/* Cabeçalho */}
                    <div className="p-5 border-b border-gray-700 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-white text-lg">
                          Mesa {p.selectedSession.table?.number}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {p.selectedSession.waiter?.name || "Sem garçom"}
                        </p>
                      </div>
                      <button
                        onClick={p.handleCloseSession}
                        className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Preferências do cliente */}
                    {(p.selectedSession?.bill?.preferredPaymentMethod || p.billData?.session?.bill?.preferredPaymentMethod) && (
                      <div className="px-5 py-3 border-b border-gray-700 flex items-center gap-4 text-xs">
                        <span className="text-gray-400">
                          Forma preferida:{" "}
                          <span className="text-orange-400 font-medium">
                            {METHOD_LABEL[p.selectedSession?.bill?.preferredPaymentMethod || p.billData?.session?.bill?.preferredPaymentMethod] || p.selectedSession?.bill?.preferredPaymentMethod || p.billData?.session?.bill?.preferredPaymentMethod}
                          </span>
                        </span>
                        <span className="text-gray-400">
                          10%:{" "}
                          <span className={p.billData?.serviceCharge > 0 ? "text-green-400 font-medium" : "text-gray-500"}>
                            {p.billData?.serviceCharge > 0 ? "Aceito" : "Não aceito"}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* Itens consumidos */}
                    <div className="p-5 border-b border-gray-700 max-h-48 overflow-auto">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Consumo
                      </p>
                      {p.billData.session?.orders?.map((order: any) =>
                        order.items?.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-1"
                          >
                            <span className="text-sm text-gray-300">
                              {item.quantity}x {item.menuItem?.name}
                            </span>
                            <span className="text-sm text-gray-400">
                              R$ {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        )),
                      )}
                    </div>

                    {/* Totais */}
                    <div className="p-5 border-b border-gray-700 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="text-white">
                          R$ {p.billData.subtotal?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          Taxa de serviço ({p.billData.restaurant?.serviceCharge}
                          %)
                        </span>
                        <span className="text-white">
                          R$ {p.billData.serviceCharge?.toFixed(2)}
                        </span>
                      </div>
                      {p.discountVal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-400">Desconto</span>
                          <span className="text-green-400">
                            - R$ {p.discountVal.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-700">
                        <span className="text-white">Total</span>
                        <span className="text-green-400">
                          R$ {p.finalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Formulário */}
                    <div className="p-5 space-y-4">
                      {/* Desconto */}
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                          Desconto (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={p.discount}
                          onChange={(e) => p.setDiscount(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      {/* Forma de pagamento */}
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-2 block">
                          Forma de Pagamento
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {PAYMENT_METHODS.map((m) => {
                            const Icon = m.icon;
                            return (
                              <button
                                key={m.value}
                                onClick={() => p.setMethod(m.value)}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                                  p.method === m.value
                                    ? `${m.bg} ${m.border} ${m.color}`
                                    : "bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                {m.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Campo dinheiro */}
                      {p.method === "CASH" && (
                        <div>
                          <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                            Valor Recebido (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={p.cashReceived}
                            onChange={(e) => p.setCashReceived(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                          />
                          {p.change > 0 && (
                            <div className="mt-2 flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                              <span className="text-sm text-gray-300">
                                Troco
                              </span>
                              <span className="text-lg font-bold text-green-400">
                                R$ {p.change.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Autorização fiado */}
                      {p.method === "STORE_CREDIT" && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <p className="text-xs font-medium text-red-400">
                              Requer autorização
                            </p>
                          </div>
                          <input
                            type="password"
                            placeholder="PIN de autorização"
                            value={p.authPin}
                            onChange={(e) => p.setAuthPin(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-red-500/30 text-white text-sm focus:outline-none focus:border-red-500"
                          />
                        </div>
                      )}

                      {/* Observação */}
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                          Observação
                        </label>
                        <input
                          placeholder="Opcional"
                          value={p.notes}
                          onChange={(e) => p.setNotes(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      {/* Botão confirmar */}
                      <button
                        onClick={p.handlePayment}
                        disabled={p.processing}
                        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                      >
                        {p.processing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCheck className="w-4 h-4" />
                        )}
                        {p.processing
                          ? "Processando..."
                          : `Confirmar Pagamento — R$ ${p.finalAmount.toFixed(2)}`}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Tab Créditos */}
        {!p.loading && p.tab === "debts" && (
          <div className="max-w-2xl">
            <p className="text-sm text-gray-400 mb-4">
              Clientes com saldo devedor (Crédito do Cliente)
            </p>
            {p.debts.length === 0 && (
              <div className="text-center py-16 bg-gray-800 border border-gray-700 rounded-2xl">
                <CheckCheck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhum saldo devedor</p>
              </div>
            )}
            <div className="space-y-3">
              {p.debts.map((debt: any) => (
                <div
                  key={debt.id}
                  className="bg-gray-800 border border-gray-700 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-white">
                        {debt.guest?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {debt.guest?.phone || debt.guest?.email}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">Saldo devedor</p>
                      <p className="text-lg font-bold text-red-400">
                        R$ {debt.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>Total: R$ {debt.totalDebt.toFixed(2)}</span>
                    <span>Pago: R$ {debt.paidAmount.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => p.handlePayDebt(debt.id, debt.balance)}
                    className="w-full py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-all"
                  >
                    Registrar Pagamento
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Relatório */}
        {!p.loading && p.tab === "report" && p.report && (
          <div className="max-w-2xl space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Total do Dia</p>
                <p className="text-xl font-bold text-green-400">
                  R$ {p.report.totalRevenue?.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Em Dinheiro</p>
                <p className="text-xl font-bold text-white">
                  R$ {p.report.totalCash?.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Digital/Cartão</p>
                <p className="text-xl font-bold text-blue-400">
                  R$ {p.report.totalDigital?.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Por forma de pagamento */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
              <p className="text-sm font-semibold text-white mb-4">
                Por Forma de Pagamento
              </p>
              <div className="space-y-3">
                {Object.entries(p.report.byMethod || {}).map(
                  ([method, amount]: any) => {
                    if (amount === 0) return null;
                    const pct =
                      p.report.totalRevenue > 0
                        ? (amount / p.report.totalRevenue) * 100
                        : 0;
                    const m = PAYMENT_METHODS.find((pm) => pm.value === method);
                    return (
                      <div key={method}>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-sm ${m?.color || "text-gray-300"}`}
                          >
                            {METHOD_LABEL[method]}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">
                              {pct.toFixed(1)}%
                            </span>
                            <span className="text-sm font-bold text-white">
                              R$ {amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${m?.bg?.replace("/10", "") || "bg-gray-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            {/* Histórico */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
              <p className="text-sm font-semibold text-white mb-4">
                Pagamentos de Hoje ({p.report.count})
              </p>
              {p.report.payments?.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Nenhum pagamento hoje
                </p>
              )}
              <div className="space-y-2">
                {p.report.payments?.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="text-sm text-gray-200">
                        Mesa {payment.session?.table?.number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {METHOD_LABEL[payment.method]} ·{" "}
                        {new Date(payment.createdAt).toLocaleTimeString(
                          "pt-BR",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-green-400">
                      R$ {payment.finalAmount?.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
