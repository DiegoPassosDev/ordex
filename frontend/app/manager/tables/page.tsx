"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthStore } from "@/store/auth.store";
import { sessionsService } from "@/services/sessions.service";
import { api } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import QRCode from "qrcode";
import {
  LayoutGrid,
  ClipboardList,
  Users,
  UtensilsCrossed,
  TrendingUp,
  Settings,
  ChefHat,
  Package,
  Plus,
  QrCode,
  Loader2,
  X,
  CheckCheck,
  Download,
} from "lucide-react";
import { TableSession } from "@/types";
import { CustomToaster, toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const navItems = [
  { href: "/manager", icon: LayoutGrid, label: "Dashboard" },
  { href: "/manager/tables", icon: UtensilsCrossed, label: "Mesas" },
  { href: "/manager/orders", icon: ClipboardList, label: "Pedidos" },
  { href: "/manager/menu", icon: ChefHat, label: "Cardápio" },
  { href: "/manager/employees", icon: Users, label: "Equipe" },
  { href: "/manager/stock", icon: Package, label: "Estoque" },
  { href: "/manager/reports", icon: TrendingUp, label: "Relatórios" },
  { href: "/manager/settings", icon: Settings, label: "Configurações" },
];

interface Table {
  id: string;
  number: number;
  qrCode: string;
  restaurantId: string;
  createdAt: string;
}

export default function TablesPage() {
  useRequireAuth("MANAGER");
  const { employee, clearAuth } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [tables, setTables] = useState<Table[]>([]);
  const [sessions, setSessions] = useState<TableSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [adding, setAdding] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  useSocket(
    { type: "restaurant", id: restaurantId },
    {
      table_session_updated: () => loadData(false),
      new_order: () => loadData(false),
      order_status_updated: () => loadData(false),
      bill_requested: () => loadData(false),
    },
  );

  async function loadData(showSpinner = true) {
    try {
      if (showSpinner) setLoading(true);
      const [tablesData, sessionsData] = await Promise.all([
        api.get(`/tables/restaurant/${restaurantId}`).then((r) => r.data),
        sessionsService.getActiveByRestaurant(restaurantId),
      ]);
      setTables(tablesData);
      setSessions(sessionsData);
    } catch {
      toast.error("Erro ao carregar mesas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTable() {
    if (!newTableNumber || isNaN(Number(newTableNumber))) {
      toast.error("Informe um número válido.");
      return;
    }
    setAdding(true);
    try {
      await api.post("/tables", {
        number: Number(newTableNumber),
        restaurantId,
      });
      toast.success(`Mesa ${newTableNumber} criada!`);
      setNewTableNumber("");
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao criar mesa.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteTable(id: string, number: number) {
    if (!confirm(`Deseja remover a Mesa ${number}?`)) return;
    try {
      await api.delete(`/tables/${id}`);
      toast.success(`Mesa ${number} removida!`);
      loadData();
    } catch {
      toast.error("Erro ao remover mesa. Verifique se não há sessão ativa.");
    }
  }

  function getTableSession(tableId: string) {
    return sessions.find((s) => s.tableId === tableId);
  }

  function getSessionTotal(session: TableSession): number {
    return (
      session.orders?.reduce((acc, o) => {
        if (o.status === "CANCELLED") return acc;
        return acc + o.items.reduce((s, i) => s + i.price * i.quantity, 0);
      }, 0) || 0
    );
  }

  function openQrModal(tableId: string) {
    setSelectedTableId(tableId);
    const table = tables.find((t) => t.id === tableId);
    if (table) {
      QRCode.toDataURL(
        `${window.location.origin}/table?tableId=${tableId}`,
        {
          width: 300,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (err, url) => {
          if (err) {
            console.error("Erro ao gerar QR code:", err);
            toast.error("Erro ao gerar QR code.");
          } else {
            setQrCodeImage(url);
            setShowQrModal(true);
          }
        },
      );
    }
  }

  const tableStatusConfig = {
    free: {
      label: "Livre",
      bg: "bg-gray-800",
      border: "border-gray-600",
      dot: "bg-gray-500",
      text: "text-gray-500",
    },
    open: {
      label: "Ocupada",
      bg: "bg-green-900/30",
      border: "border-green-700",
      dot: "bg-green-400",
      text: "text-green-400",
    },
    bill: {
      label: "Conta",
      bg: "bg-orange-900/30",
      border: "border-orange-700",
      dot: "bg-orange-400",
      text: "text-orange-400",
    },
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <CustomToaster />
      <Sidebar items={navItems} />

      <div className="flex-1 pl-0 md:pl-16 overflow-auto">
        <div className="w-full px-4 sm:px-6 xl:px-10 py-6 sm:py-8">
          <Header
            title=""
            subtitle="Gerencie as mesas do restaurante"
            restaurantId={restaurantId}
          />
          <div className="flex justify-end mb-6">
            <Button
              icon={Plus}
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto"
            >
              Nova Mesa
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          )}

          {!loading && (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 sm:p-5">
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {tables.length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Total de mesas
                  </p>
                </div>
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 sm:p-5">
                  <p className="text-2xl sm:text-3xl font-bold text-green-400">
                    {sessions.length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Mesas ocupadas
                  </p>
                </div>
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 sm:p-5">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-400">
                    {tables.length - sessions.length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Mesas livres
                  </p>
                </div>
              </div>

              {/* Grid de mesas */}
              <Card>
                <CardHeader>
                  <CardTitle>Todas as Mesas</CardTitle>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-500" />
                      Livre
                    </span>

                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      Ocupada
                    </span>

                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      Conta
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {tables.length} mesas cadastradas
                  </span>
                </CardHeader>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
                  {tables.map((table) => {
                    const session = getTableSession(table.id);
                    const status = !session
                      ? "free"
                      : session.status === "REQUESTING_BILL"
                        ? "bill"
                        : "open";
                    const config = tableStatusConfig[status];
                    const total = session ? getSessionTotal(session) : 0;

                    return (
                      <div
                        key={table.id}
                        className={`rounded-2xl border-2 p-3 sm:p-4 transition-all ${config.bg} ${config.border}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-gray-100">
                            Mesa {table.number}
                          </span>
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${config.dot}`}
                          />
                        </div>
                        <p
                          className={`text-xs font-medium ${config.text} mb-2`}
                        >
                          {config.label}
                        </p>
                        {session && (
                          <>
                            <p className="text-xs text-gray-400 truncate">
                              {session.waiter?.name || "Sem garçom"}
                            </p>
                            <p className="text-xs font-semibold text-white mt-1">
                              R$ {total.toFixed(2)}
                            </p>
                          </>
                        )}
                        <div className="flex items-center gap-1 mt-3">
                          <button
                            onClick={() => openQrModal(table.id)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all text-xs"
                            title="Gerar QR Code"
                          >
                            <QrCode className="w-3 h-3" />
                            QR
                          </button>
                          {!session && (
                            <button
                              onClick={() =>
                                handleDeleteTable(table.id, table.number)
                              }
                              className="flex items-center justify-center px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                              title="Remover mesa"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          {session && (
                            <div
                              className="flex items-center justify-center px-2 py-1.5 rounded-lg bg-green-500/10 text-green-400"
                              title="Mesa com sessão ativa"
                            >
                              <CheckCheck className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Modal Nova Mesa */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">Nova Mesa</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-5">
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Número da Mesa
              </label>
              <input
                type="number"
                placeholder="Ex: 13"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTable()}
                className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            <div className="flex justify-center gap-3">
              <Button
                className="flex-1"
                icon={Plus}
                loading={adding}
                onClick={handleAddTable}
              >
                Criar Mesa
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowAddModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {showQrModal && selectedTableId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowQrModal(false)}
          />
          <div className="relative bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">
                QR Code - Mesa{" "}
                {tables.find((t) => t.id === selectedTableId)?.number}
              </h3>
              <button onClick={() => setShowQrModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center justify-center bg-white p-4 rounded-xl mb-5">
              {qrCodeImage ? (
                <img
                  src={qrCodeImage}
                  alt="QR Code"
                  className="w-full h-auto"
                />
              ) : (
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              )}
            </div>

            <div className="flex justify-center gap-2">
              <Button
                variant="secondary"
                className="flex-1 bg-gray-700 border-gray-600 text-gray-300"
                onClick={() => {
                  const win = window.open("", "_blank");
                  if (!win) return;
                  const tableNum = tables.find(
                    (t) => t.id === selectedTableId,
                  )?.number;
                  win.document.write(`
                    <html><head><title>Mesa ${tableNum}</title>
                    <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Arial;background:white}.c{text-align:center;padding:40px;border:2px solid #e5e7eb;border-radius:24px}.logo{font-size:24px;font-weight:bold;color:#f97316;margin-bottom:8px}.name{font-size:18px;font-weight:600;color:#1f2937;margin-bottom:20px}img{width:250px;height:250px}.hint{margin-top:16px;font-size:13px;color:#6b7280}</style>
                    </head><body><div class="c"><div class="logo">Ordex</div><div class="name">Mesa ${tableNum}</div><img src="${qrCodeImage}"/><div class="hint">Escaneie para fazer seu pedido</div></div><script>window.onload=()=>{window.print();window.close()}</script></body></html>
                  `);
                  win.document.close();
                }}
              >
                Imprimir
              </Button>
              <Button
                className="flex-1"
                icon={Download}
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = qrCodeImage;
                  link.download = `qr-mesa-${tables.find((t) => t.id === selectedTableId)?.number}.png`;
                  link.click();
                  toast.success("QR Code baixado!");
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
