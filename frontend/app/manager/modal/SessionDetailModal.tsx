"use client";

import { Loader2, X, UserCheck, Clock, DollarSign, Users, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { TableSession, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/types";
import type { DashboardSession } from "../useManagerDashboard";

interface Props {
  session: DashboardSession;
  onClose: () => void;
  getSessionStatus: (s: TableSession) => "free" | "open" | "bill";
  getSessionTotal: (s: TableSession) => number;
  getOrderElapsed: (o: any) => string;
  getSessionDuration: (d: string) => string;
  getGuestName: (s: DashboardSession | null) => string | null;
  handleCancelOrder: (id: string) => void;
  handleCloseClick: (id: string) => void;
  cancelling: string | null;
}

export function SessionDetailModal({
  session,
  onClose,
  getSessionStatus,
  getSessionTotal,
  getOrderElapsed,
  getSessionDuration,
  getGuestName,
  handleCancelOrder,
  handleCloseClick,
  cancelling,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-t-3xl sm:rounded-2xl border border-gray-700 w-full sm:max-w-2xl mx-0 sm:mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <span className="text-orange-400 font-bold">
                {session.table?.number}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">
                Mesa {session.table?.number}
              </h3>
              <p className="text-xs text-gray-400">
                {getSessionStatus(session) === "bill"
                  ? "⚠️ Pedindo conta"
                  : "● Sessão ativa"}
              </p>
            </div>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 p-4 border-b border-gray-700">
          <div className="bg-gray-700/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-orange-400" />
              <p className="text-xs text-gray-400">Cliente</p>
            </div>
            <p className="text-sm font-semibold text-white truncate">
              {getGuestName(session)?.split(" ")[0] || "—"}
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-xs text-gray-400">Garçom</p>
            </div>
            <p className="text-sm font-semibold text-white truncate">
              {session.waiter?.name || "Nenhum"}
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <p className="text-xs text-gray-400">Tempo</p>
            </div>
            <p className="text-sm font-semibold text-white">
              {getSessionDuration(session.openedAt)}
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-green-400" />
              <p className="text-xs text-gray-400">Total</p>
            </div>
            <p className="text-sm font-bold text-green-400">
              R$ {getSessionTotal(session).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Pedidos ({session.orders?.length || 0})
          </p>

          {(!session.orders || session.orders.length === 0) && (
            <p className="text-gray-500 text-sm text-center py-8">
              Nenhum pedido ainda
            </p>
          )}

          <div className="space-y-3">
            {session.orders
              ?.slice()
              .sort((a, b) => {
                const order = [
                  "WAITING",
                  "PREPARING",
                  "READY",
                  "ON_THE_WAY",
                  "DELIVERED",
                  "CANCELLED",
                ];
                return order.indexOf(a.status) - order.indexOf(b.status);
              })
              .map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-700/50 rounded-xl p-3 border border-gray-600"
                >
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <StatusBadge status={order.status} />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {getOrderElapsed(order)}
                      </span>
                      <span className="text-sm font-bold text-white">
                        R${" "}
                        {order.items
                          .reduce((acc, i) => acc + i.price * i.quantity, 0)
                          .toFixed(2)}
                      </span>
                      {order.status !== "CANCELLED" &&
                        order.status !== "DELIVERED" && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancelling === order.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs disabled:opacity-50"
                          >
                            {cancelling === order.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            Cancelar
                          </button>
                        )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
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
                </div>
              ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Total acumulado</p>
            <p className="text-xl font-bold text-green-400">
              R$ {getSessionTotal(session).toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="bg-gray-700 border-gray-600 text-gray-300"
              onClick={onClose}
            >
              Fechar
            </Button>
            <Button
              variant="danger"
              onClick={() => handleCloseClick(session.id)}
            >
              Encerrar Mesa
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
