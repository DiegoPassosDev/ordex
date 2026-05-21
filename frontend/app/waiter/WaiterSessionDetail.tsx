"use client";

import { useState } from "react";
import { Bell, AlertCircle, CheckCheck, Plus, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSession } from "@/types";
import { WaiterAddOrderModal } from "./modal/WaiterAddOrderModal";
import { WaiterCloseBillModal } from "./modal/WaiterCloseBillModal";

interface SessionDetailProps {
  session: TableSession;
  restaurantId: string;
  onBack: () => void;
  onAcceptTable: (sessionId: string) => Promise<void>;
  onDeliverOrder: (orderId: string) => Promise<void>;
  onCloseBill: (sessionId: string) => Promise<void>;
  onOrderPlaced: () => Promise<void>;
  getSessionStatus: (
    session: TableSession,
  ) => "active" | "bill" | "call";
  getSessionTotal: (session: TableSession) => number;
}

const tableStatusConfig = {
  active: {
    label: "Ativa",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
    dot: "bg-green-400",
  },
  bill: {
    label: "Pedindo Conta",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    dot: "bg-orange-400",
  },
  call: {
    label: "Chamando",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
};

export function WaiterSessionDetail({
  session,
  restaurantId,
  onBack,
  onAcceptTable,
  onDeliverOrder,
  onCloseBill,
  onOrderPlaced,
  getSessionStatus,
  getSessionTotal,
}: SessionDetailProps) {
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showCloseBill, setShowCloseBill] = useState(false);
  const status = getSessionStatus(session);
  const config = tableStatusConfig[status];
  const readyOrders = session.orders?.filter((o) => o.status === "READY") || [];
  const isUnassigned = !session.waiterId;
  const guestId = session.guests?.[0]?.id;

  return (
    <div className="h-dvh bg-gray-900 w-full max-w-md mx-auto flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 shrink-0 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-gray-300 text-base hover:bg-gray-600 transition-colors"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <span className="text-orange-400 text-xs font-bold">
                {session.table?.number}
              </span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">
                Mesa {session.table?.number}
              </p>
              <p className="text-xs text-gray-400">
                {session.guests?.[0]?.name || `Mesa ${session.table?.number}`}
              </p>
            </div>
          </div>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.border} ${config.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4">
        {isUnassigned && (
          <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">Mesa sem garçom</span>
            </div>
            <Button size="sm" onClick={() => onAcceptTable(session.id)}>
              Aceitar
            </Button>
          </div>
        )}

        {session.status === "REQUESTING_BILL" && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-300">
                Conta solicitada — Aguardando caixa processar
              </span>
            </div>
          </div>
        )}

        {session.status !== "REQUESTING_BILL" && session.status !== "CLOSED" && !isUnassigned && (
          <button
            onClick={() => setShowCloseBill(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-medium text-sm hover:bg-orange-500/20 transition-all"
          >
            <DollarSign className="w-4 h-4" />
            Solicitar Conta
          </button>
        )}

        {readyOrders.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-3">
            <p className="text-xs font-medium text-green-400 mb-1">
              ✅ {readyOrders.length} item(s) pronto(s)
            </p>
            {readyOrders.map((o) =>
              o.items.map((item, i) => (
                <p key={i} className="text-xs text-green-300">
                  {item.quantity}x {item.menuItem?.name}
                </p>
              )),
            )}
          </div>
        )}

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Pedidos
        </p>

        <div className="space-y-3">
          {(!session.orders || session.orders.length === 0) && (
            <p className="text-gray-500 text-sm text-center py-4">
              Nenhum pedido ainda
            </p>
          )}
          {session.orders?.map((order) => (
            <div
              key={order.id}
              className="bg-gray-800 rounded-2xl border border-gray-700 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status={order.status} />
                {order.status === "READY" && (
                  <Button
                    size="sm"
                    icon={CheckCheck}
                    onClick={() => onDeliverOrder(order.id)}
                  >
                    Entregar
                  </Button>
                )}
              </div>
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 mt-2">
                  <span className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
                    {item.quantity}
                  </span>
                  <span className="text-sm text-gray-200">
                    {item.menuItem?.name}
                  </span>
                  {item.notes && (
                    <span className="text-xs text-gray-400 italic">
                      — {item.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-400">Total acumulado</span>
          <span className="text-base font-bold text-white">
            R$ {getSessionTotal(session).toFixed(2)}
          </span>
        </div>
      </div>

      <button
        onClick={() => setShowAddOrder(true)}
        className="fixed bottom-4 left-4 z-30 w-12 h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-900/40 flex items-center justify-center transition-all"
        title="Adicionar pedido"
      >
        <Plus className="w-5 h-5" />
      </button>

      {showAddOrder && guestId && (
        <WaiterAddOrderModal
          sessionId={session.id}
          guestId={guestId}
          restaurantId={restaurantId}
          onClose={() => setShowAddOrder(false)}
          onSuccess={onOrderPlaced}
        />
      )}

      {showCloseBill && (
        <WaiterCloseBillModal
          session={session}
          onClose={() => setShowCloseBill(false)}
          onSuccess={onOrderPlaced}
        />
      )}
    </div>
  );
}
