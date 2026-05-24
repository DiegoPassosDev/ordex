"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Bell, CheckCheck, Plus, Clock } from "lucide-react";
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
  onOrderPlaced,
  getSessionStatus,
  getSessionTotal,
}: SessionDetailProps) {
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showCloseBill, setShowCloseBill] = useState(false);
  const [sessionTime, setSessionTime] = useState("24 min");

  useEffect(() => {
    if (session.openedAt) {
      const now = new Date();
      const start = new Date(session.openedAt);
      const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
      setSessionTime(`${diffMinutes} min`);
    }
  }, [session.openedAt]);

  const status = getSessionStatus(session);
  const config = tableStatusConfig[status];
  const isUnassigned = !session.waiterId;
  const guestId = session.guests?.[0]?.id;
  const orderNumber = session.id.slice(-4).toUpperCase();

  return (
    <div className="h-dvh bg-gray-900 w-full max-w-md mx-auto flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 shrink-0">
        {/* Header com 3 grupos */}
        <div className="flex items-center justify-between gap-4 py-3 px-4">
          {/* Botão voltar */}
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg bg-gray-700/50 border border-gray-700 flex items-center justify-center text-gray-300 hover:bg-orange-500/20 hover:border-orange-500/30 hover:text-orange-400 active:scale-95 transition-all"
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </button>

          {/* Identificação */}
          <div className="flex items-center gap-2 flex-1">
            <div className="h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center px-2">
              <span className="text-orange-400 text-xs font-bold leading-none whitespace-nowrap">
                Mesa {session.table?.number}
              </span>
            </div>
            <span className="text-gray-300 text-sm font-medium">·</span>
            <span className="text-white text-sm font-medium truncate max-w-[120px]">
              {session.guests?.[0]?.name?.split(" ")[0] || session.guestLabel?.split(" ")[0] || `Mesa ${session.table?.number}`}
            </span>
          </div>

          {/* Status */}
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.border} ${config.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
            {config.label}
          </span>
        </div>

        {/* Linha de contexto */}
        <div className="border-t border-gray-700 flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500 font-medium">
              Aberta há {sessionTime}
            </span>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            #{orderNumber}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-6">
        {/* Botão "Aceitar Mesa" para mesas sem garçom */}
        {isUnassigned && (
          <button
            onClick={() => onAcceptTable(session.id)}
            className="w-full py-3 rounded-2xl bg-blue-400 text-white font-semibold text-base hover:brightness-110 transition-all"
          >
            Aceitar Mesa
          </button>
        )}

        {/* Botão "Solicitar Conta" */}
        {!isUnassigned && session.status !== "REQUESTING_BILL" && session.status !== "CLOSED" && (
          <button
            onClick={() => setShowCloseBill(true)}
            className="w-full py-3 rounded-2xl bg-orange-500 text-white font-semibold text-base hover:bg-orange-600 transition-all"
          >
            Solicitar Conta
          </button>
        )}

        {/* Seção de Pedidos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              PEDIDOS
            </p>
            <p className="text-xs font-medium text-gray-400">
              {session.orders?.length || 0} itens
            </p>
          </div>

          {(!session.orders || session.orders.length === 0) ? (
            <div className="bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-2xl px-6 py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gray-700/50 flex items-center justify-center">
                <Bell className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-400 mb-1">
                Nenhum pedido ainda
              </p>
              <p className="text-xs text-gray-500">
                Aguardando o cliente
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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
          )}
        </div>

        {/* Total Acumulado */}
        <div className="bg-gray-800/80 rounded-2xl border border-gray-700 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-400">Total acumulado</span>
          <span className="text-base font-bold text-white">
            R$ {getSessionTotal(session).toFixed(2)}
          </span>
        </div>
      </div>

      {/* FAB (botão flutuante) — só aparece se o garçom já aceitou a mesa */}
      {!isUnassigned && (
        <div className="fixed bottom-4 left-4 z-30 flex items-center gap-2">
          <button
            onClick={() => setShowAddOrder(true)}
            className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-900/40 flex items-center justify-center transition-all"
            title="Adicionar pedido"
          >
            <Plus className="w-5 h-5" />
          </button>
          <span className="px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium backdrop-blur-sm">
            Adicionar pedido
          </span>
        </div>
      )}

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
