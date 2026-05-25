"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Toast";

export const METHOD_LABEL: Record<string, string> = {
  CASH: "Dinheiro", PIX: "Pix", DEBIT: "Débito", CREDIT: "Crédito",
  VOUCHER: "Vale Refeição", CHECK: "Cheque", STORE_CREDIT: "Crédito do Cliente", MIXED: "Misto",
};

export function useCashierPage() {
  useRequireAuth("CASHIER");
  const { employee, clearAuth } = useAuthStore();
  const router = useRouter();
  const restaurantId = employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [sessions, setSessions] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [billData, setBillData] = useState<any>(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState<"sessions" | "debts" | "report">("sessions");
  const [report, setReport] = useState<any>(null);

  const [method, setMethod] = useState("CASH");
  const [discount, setDiscount] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [notes, setNotes] = useState("");
  const [authPin, setAuthPin] = useState("");

  useEffect(() => {
    if (!restaurantId) return;
    loadAll();
  }, [restaurantId]);

  useSocket(
    { type: "restaurant", id: restaurantId },
    {
      bill_requested: () => {
        loadAll();
        toast("Mesa pedindo conta!", { icon: "🔔" });
      },
      new_order: () => loadAll(),
      table_session_updated: () => loadAll(),
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
    setDiscount("");
    setCashReceived("");
    setNotes("");
    setAuthPin("");
    setMethod(session.bill?.preferredPaymentMethod || "CASH");
    try {
      const { data } = await api.get(`/payments/session/${session.id}/bill`);
      setBillData(data);
      if (data.session?.bill?.preferredPaymentMethod) {
        setMethod(data.session.bill.preferredPaymentMethod);
      }
    } catch {
      toast.error("Erro ao carregar conta.");
    } finally {
      setLoadingBill(false);
    }
  }

  function handleCloseSession() {
    setSelectedSession(null);
    setBillData(null);
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

    if (method === "CASH" && cashReceivedVal > 0 && cashReceivedVal < finalAmount) {
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
        cashReceived: method === "CASH" && cashReceivedVal > 0 ? cashReceivedVal : undefined,
        notes: notes || undefined,
        authorizedBy: method === "STORE_CREDIT" ? authPin : undefined,
      });
      toast.success("Pagamento registrado! Mesa liberada.");
      setSelectedSession(null);
      setBillData(null);
      loadAll();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao registrar pagamento.";
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
      toast.error(err?.response?.data?.message || "Erro ao registrar pagamento.");
    }
  }

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  const discountVal = parseFloat(discount) || 0;
  const finalAmount = billData ? Math.max(0, billData.finalAmount - discountVal) : 0;
  const change = method === "CASH" && parseFloat(cashReceived) > 0
    ? Math.max(0, parseFloat(cashReceived) - finalAmount)
    : 0;

  const billSessions = sessions.filter((s: any) => s.status === "REQUESTING_BILL");
  const openSessions = sessions.filter((s: any) => s.status === "OPEN");

  function getSessionTotal(session: any): number {
    return (
      session.orders?.reduce((acc: number, o: any) => {
        if (o.status === "CANCELLED") return acc;
        return acc + o.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      }, 0) || 0
    );
  }

  function getSessionItemCount(session: any): number {
    return (
      session.orders?.reduce((acc: number, o: any) => {
        if (o.status === "CANCELLED") return acc;
        return acc + o.items.reduce((s: number, i: any) => s + i.quantity, 0);
      }, 0) || 0
    );
  }

  const overallTotal = sessions.reduce((acc, s) => acc + getSessionTotal(s), 0);

  return {
    employee,
    loading,
    tab, setTab,
    sessions,
    debts,
    report,
    selectedSession,
    billData,
    loadingBill,
    processing,
    method, setMethod,
    discount, setDiscount,
    cashReceived, setCashReceived,
    notes, setNotes,
    authPin, setAuthPin,
    discountVal,
    finalAmount,
    change,
    billSessions,
    openSessions,
    getSessionTotal,
    getSessionItemCount,
    overallTotal,
    handleSelectSession,
    handleCloseSession,
    handlePayment,
    handlePayDebt,
    handleLogout,
  };
}
