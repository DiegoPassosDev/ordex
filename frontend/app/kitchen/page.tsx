'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ordersService } from '@/services/orders.service';
import { useSocket } from '@/hooks/useSocket';
import { Order } from '@/types';
import { ChefHat, Clock, CheckCheck, Flame, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useRequireAuth } from '@/hooks/useRequireAuth';

const RESTAURANT_ID = 'f4385ae5-6187-40f8-97b4-d289d47dc441';

function getElapsedMinutes(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
}

function ElapsedTimer({ date }: { date: string }) {
  const [minutes, setMinutes] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMinutes(Math.floor((Date.now() - new Date(date).getTime()) / 60000));
    const interval = setInterval(() => {
      setMinutes(Math.floor((Date.now() - new Date(date).getTime()) / 60000));
    }, 60000);
    return () => clearInterval(interval);
  }, [date]);

  if (!mounted) return null;

  const isLate = minutes >= 15;
  const isWarning = minutes >= 10;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        isLate
          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
          : isWarning
          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          : 'bg-gray-700 text-gray-400 border border-gray-600'
      }`}
    >
      <Clock className="w-3 h-3" />
      {minutes} min
    </span>
  );
}

export default function KitchenPage() {
  useRequireAuth("KITCHEN");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadOrders();
  }, []);

  // WebSocket — recebe novos pedidos em tempo real
  useSocket(
    { type: 'restaurant', id: RESTAURANT_ID },
    {
      new_order: (order: Order) => {
        setOrders((prev) => {
          const exists = prev.find((o) => o.id === order.id);
          if (exists) return prev;
          return [order, ...prev];
        });
        toast.success(`Novo pedido — Mesa ${order.session?.table?.number}!`);
        try { new Audio('/sounds/new-order.mp3').play(); } catch {}
      },
      order_status_updated: (order: Order) => {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      },
    },
  );

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await ordersService.getByRestaurant(RESTAURANT_ID);
      const active = data.filter(
        (o: Order) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED',
      );
      setOrders(active);
    } catch {
      toast.error('Erro ao carregar pedidos.');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await ordersService.updateStatus(id, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: status as any } : o)),
      );
    } catch {
      toast.error('Erro ao atualizar status.');
    }
  }

  const waiting  = orders.filter((o) => o.status === 'WAITING');
  const preparing = orders.filter((o) => o.status === 'PREPARING');
  const ready    = orders.filter((o) => o.status === 'READY');

  const columns = [
    {
      title: 'Aguardando',
      status: 'WAITING',
      orders: waiting,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      dot: 'bg-yellow-400',
      action: { label: 'Iniciar Preparo', next: 'PREPARING' },
    },
    {
      title: 'Em Preparo',
      status: 'PREPARING',
      orders: preparing,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      dot: 'bg-blue-400',
      action: { label: 'Marcar Pronto', next: 'READY' },
    },
    {
      title: 'Pronto',
      status: 'READY',
      orders: ready,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      dot: 'bg-green-400',
      action: null,
    },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
            <ChefHat className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base md:text-xl font-bold text-white">Cozinha — Ordex</h1>
            <p className="text-gray-400 text-xs md:text-sm">Painel de pedidos em tempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loading && <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />}
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 md:px-4 rounded-xl">
            <Flame className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="text-white text-xs md:text-sm font-medium">
              <span className="hidden sm:inline">{waiting.length + preparing.length} pedidos ativos</span>
              <span className="sm:hidden">{waiting.length + preparing.length} ativos</span>
            </span>
          </div>
        </div>
      </div>

      {/* Colunas Kanban
          — mobile:         1 coluna empilhada
          — tablet (sm):    cards em 2 colunas dentro de cada seção
          — desktop (md+):  3 colunas kanban lado a lado
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {columns.map((col) => (
          <div key={col.status}>

            {/* Título da coluna */}
            <div className={`flex items-center gap-2 mb-3 md:mb-4 px-4 py-2.5 md:py-3 rounded-xl ${col.bg} border ${col.border}`}>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dot}`} />
              <span className={`font-semibold text-sm ${col.color}`}>{col.title}</span>
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
                {col.orders.length}
              </span>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
              {col.orders.length === 0 && (
                <div className="text-center py-10 md:py-12 text-gray-600 text-sm col-span-full">
                  Nenhum pedido
                </div>
              )}

              {col.orders.map((order) => {
                const isLate = mounted ? getElapsedMinutes(order.createdAt) >= 15 : false;

                return (
                  <div
                    key={order.id}
                    className={`bg-gray-800 rounded-2xl p-4 border transition-all ${
                      isLate ? 'border-red-500/50' : 'border-gray-700'
                    }`}
                  >
                    {/* Cabeçalho do card */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                          <span className="text-orange-400 text-xs font-bold">
                            {order.session?.table?.number ?? '?'}
                          </span>
                        </div>
                        <span className="text-white font-semibold text-sm">
                          Mesa {order.session?.table?.number ?? '?'}
                        </span>
                      </div>
                      <ElapsedTimer date={order.createdAt} />
                    </div>

                    {/* Itens */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-md bg-gray-700 flex items-center justify-center text-gray-300 text-xs font-bold shrink-0 mt-0.5">
                            {item.quantity}
                          </span>
                          <div>
                            <p className="text-gray-100 text-sm font-medium">
                              {item.menuItem?.name}
                            </p>
                            {item.notes && (
                              <p className="text-gray-400 text-xs mt-0.5">⚠️ {item.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Botão de ação */}
                    {col.action && (
                      <Button
                        variant={col.action.next === 'PREPARING' ? 'primary' : 'secondary'}
                        size="sm"
                        icon={col.action.next === 'READY' ? CheckCheck : Flame}
                        className="w-full"
                        onClick={() => updateStatus(order.id, col.action!.next)}
                      >
                        {col.action.label}
                      </Button>
                    )}

                    {col.status === 'READY' && (
                      <div className="flex items-center justify-center gap-2 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20">
                        <CheckCheck className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-xs font-medium">
                          Aguardando garçom
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
