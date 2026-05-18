"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  DollarSign,
  CreditCard,
  Smartphone,
  Receipt,
  Users,
  AlertCircle,
  CheckCheck,
  Loader2,
  ChevronRight,
  X,
  Bell,
  LogOut,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CustomToaster, toast } from "@/components/ui/Toast";
const PAYMENT_METHODS = [
  {
    value: "CASH",
    label: "Dinheiro",
    icon: DollarSign,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
  },
  {
    value: "PIX",
    label: "Pix",
    icon: Smartphone,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  {
    value: "DEBIT",
    label: "Débito",
    icon: CreditCard,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  {
    value: "CREDIT",
    label: "Crédito",
    icon: CreditCard,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
  },
  {
    value: "VOUCHER",
    label: "Vale Refeição",
    icon: Receipt,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
  {
    value: "CHECK",
    label: "Cheque",
    icon: Receipt,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
  },
  {
    value: "STORE_CREDIT",
    label: "Crédito do Cliente",
    icon: Wallet,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
];

const METHOD_LABEL: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  DEBIT: "Débito",
  CREDIT: "Crédito",
  VOUCHER: "Vale Refeição",
  CHECK: "Cheque",
  STORE_CREDIT: "Crédito do Cliente",
  MIXED: "Misto",
};

export default function CashierPage() {
  useRequireAuth("CASHIER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [sessions, setSessions] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [billData, setBillData] = useState<any>(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState<"sessions" | "debts" | "report">("sessions");
  const [report, setReport] = useState<any>(null);

  // Formulário de pagamento
  const [method, setMethod] = useState("CASH");
  const [discount, setDiscount] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [notes, setNotes] = useState("");
  const [authPin, setAuthPin] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  useSocket(
    { type: "restaurant", id: restaurantId },
    {
      bill_requested: () => {
        loadAll();
        toast("Mesa pedindo conta!", { icon: "🔔" });
      },
      new_order: () => loadAll(),
    },
  );

  async function loadAll() {
    try {
      setLoading(true);
      const [sessionsRes, debtsRes, reportRes] = await Promise.all([
        api.get(`/payments/restaurant/${restaurantId}/pending`),
        api.get(`/payments/restaurant/${restaurantId}/debts`),
        api.get(`/payments/restaurant/${restaurantId}/report`),
      ]);
      setSessions(sessionsRes.data);
      setDebts(debtsRes.data);
      setReport(reportRes.data);
    } catch {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectSession(session: any) {
    setSelectedSession(session);
    setLoadingBill(true);
    setMethod("CASH");
    setDiscount("");
    setCashReceived("");
    setNotes("");
    setAuthPin("");
    try {
      const { data } = await api.get(`/payments/session/${session.id}/bill`);
      setBillData(data);
    } catch {
      toast.error("Erro ao carregar conta.");
    } finally {
      setLoadingBill(false);
    }
  }

  async function handlePayment() {
    if (!selectedSession || !billData) return;
    if (method === "STORE_CREDIT" && !authPin) {
      toast.error("PIN de autorização obrigatório para Crédito do Cliente.");
      return;
    }

    const discountVal = parseFloat(discount) || 0;
    const finalAmount = billData.finalAmount - discountVal;
    const cashReceivedVal = parseFloat(cashReceived) || 0;

    if (
      method === "CASH" &&
      cashReceivedVal > 0 &&
      cashReceivedVal < finalAmount
    ) {
      toast.error("Valor recebido menor que o total.");
      return;
    }

    setProcessing(true);
    try {
      await api.post("/payments", {
        sessionId: selectedSession.id,
        restaurantId,
        cashierId: employee?.id,
        method,
        discount: discountVal,
        cashReceived:
          method === "CASH" && cashReceivedVal > 0
            ? cashReceivedVal
            : undefined,
        notes: notes || undefined,
        authorizedBy: method === "STORE_CREDIT" ? authPin : undefined,
      });
      toast.success("Pagamento registrado! Mesa liberada.");
      setSelectedSession(null);
      setBillData(null);
      loadAll();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Erro ao registrar pagamento.";
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  }

  async function handlePayDebt(debtId: string, amount: number) {
    const amountStr = prompt(`Valor a pagar (saldo: R$ ${amount.toFixed(2)}):`);
    if (!amountStr) return;
    const amountVal = parseFloat(amountStr);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("Valor inválido.");
      return;
    }
    try {
      await api.post(`/payments/debts/${debtId}/pay`, {
        amount: amountVal,
        authorizedBy: employee?.id,
      });
      toast.success("Pagamento de dívida registrado!");
      loadAll();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Erro ao registrar pagamento.",
      );
    }
  }

  const discountVal = parseFloat(discount) || 0;
  const finalAmount = billData
    ? Math.max(0, billData.finalAmount - discountVal)
    : 0;
  const change =
    method === "CASH" && parseFloat(cashReceived) > 0
      ? Math.max(0, parseFloat(cashReceived) - finalAmount)
      : 0;

  const billSessions = sessions.filter((s) => s.status === "REQUESTING_BILL");
  const openSessions = sessions.filter((s) => s.status === "OPEN");

  function getSessionTotal(session: any): number {
    return (
      session.orders?.reduce((acc: number, o: any) => {
        if (o.status === "CANCELLED") return acc;
        return (
          acc +
          o.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)
        );
      }, 0) || 0
    );
  }

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
              <p className="text-xs text-gray-400">{employee?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {billSessions.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                <Bell className="w-3.5 h-3.5" />
                {billSessions.length} conta(s)
              </div>
            )}
            <button
              onClick={() => {
                clearAuth();
                router.push("/login");
              }}
              className="w-9 h-9 rounded-xl bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto mt-3 flex gap-1 bg-gray-700/50 rounded-xl p-1">
          {[
            { key: "sessions", label: "Mesas", count: sessions.length },
            { key: "debts", label: "Créditos", count: debts.length },
            { key: "report", label: "Relatório" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t.key ? "bg-gray-600 text-white" : "text-gray-400"
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    tab === t.key
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
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}

        {/* Tab Mesas */}
        {!loading && tab === "sessions" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de mesas */}
            <div className="space-y-3">
              {billSessions.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Pedindo Conta
                  </p>
                  {billSessions.map((session) => {
                    const total = getSessionTotal(session);
                    return (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedSession?.id === session.id
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

              {openSessions.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                    Mesas Abertas
                  </p>
                  {openSessions.map((session) => {
                    const total = getSessionTotal(session);
                    return (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          selectedSession?.id === session.id
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

              {sessions.length === 0 && (
                <div className="text-center py-16">
                  <CheckCheck className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Nenhuma mesa ativa</p>
                </div>
              )}
            </div>

            {/* Painel de pagamento */}
            <div>
              {!selectedSession ? (
                <div className="bg-gray-800 border border-gray-700 rounded-2xl flex flex-col items-center justify-center py-20">
                  <Receipt className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-gray-500 text-sm">
                    Selecione uma mesa para registrar o pagamento
                  </p>
                </div>
              ) : loadingBill ? (
                <div className="bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
              ) : (
                billData && (
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                    {/* Cabeçalho */}
                    <div className="p-5 border-b border-gray-700 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-white text-lg">
                          Mesa {selectedSession.table?.number}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {selectedSession.waiter?.name || "Sem garçom"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSession(null);
                          setBillData(null);
                        }}
                        className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Itens consumidos */}
                    <div className="p-5 border-b border-gray-700 max-h-48 overflow-auto">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Consumo
                      </p>
                      {billData.session?.orders?.map((order: any) =>
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
                          R$ {billData.subtotal?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          Taxa de serviço ({billData.restaurant?.serviceCharge}
                          %)
                        </span>
                        <span className="text-white">
                          R$ {billData.serviceCharge?.toFixed(2)}
                        </span>
                      </div>
                      {discountVal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-400">Desconto</span>
                          <span className="text-green-400">
                            - R$ {discountVal.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-700">
                        <span className="text-white">Total</span>
                        <span className="text-green-400">
                          R$ {finalAmount.toFixed(2)}
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
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
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
                                onClick={() => setMethod(m.value)}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                                  method === m.value
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
                      {method === "CASH" && (
                        <div>
                          <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                            Valor Recebido (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                          />
                          {change > 0 && (
                            <div className="mt-2 flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                              <span className="text-sm text-gray-300">
                                Troco
                              </span>
                              <span className="text-lg font-bold text-green-400">
                                R$ {change.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Autorização fiado */}
                      {method === "STORE_CREDIT" && (
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
                            value={authPin}
                            onChange={(e) => setAuthPin(e.target.value)}
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
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      {/* Botão confirmar */}
                      <button
                        onClick={handlePayment}
                        disabled={processing}
                        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                      >
                        {processing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCheck className="w-4 h-4" />
                        )}
                        {processing
                          ? "Processando..."
                          : `Confirmar Pagamento — R$ ${finalAmount.toFixed(2)}`}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Tab Créditos */}
        {!loading && tab === "debts" && (
          <div className="max-w-2xl">
            <p className="text-sm text-gray-400 mb-4">
              Clientes com saldo devedor (Crédito do Cliente)
            </p>
            {debts.length === 0 && (
              <div className="text-center py-16 bg-gray-800 border border-gray-700 rounded-2xl">
                <CheckCheck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhum saldo devedor</p>
              </div>
            )}
            <div className="space-y-3">
              {debts.map((debt) => (
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
                    onClick={() => handlePayDebt(debt.id, debt.balance)}
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
        {!loading && tab === "report" && report && (
          <div className="max-w-2xl space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Total do Dia</p>
                <p className="text-xl font-bold text-green-400">
                  R$ {report.totalRevenue?.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Em Dinheiro</p>
                <p className="text-xl font-bold text-white">
                  R$ {report.totalCash?.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Digital/Cartão</p>
                <p className="text-xl font-bold text-blue-400">
                  R$ {report.totalDigital?.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Por forma de pagamento */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
              <p className="text-sm font-semibold text-white mb-4">
                Por Forma de Pagamento
              </p>
              <div className="space-y-3">
                {Object.entries(report.byMethod || {}).map(
                  ([method, amount]: any) => {
                    if (amount === 0) return null;
                    const pct =
                      report.totalRevenue > 0
                        ? (amount / report.totalRevenue) * 100
                        : 0;
                    const m = PAYMENT_METHODS.find((p) => p.value === method);
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
                Pagamentos de Hoje ({report.count})
              </p>
              {report.payments?.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Nenhum pagamento hoje
                </p>
              )}
              <div className="space-y-2">
                {report.payments?.map((payment: any) => (
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
