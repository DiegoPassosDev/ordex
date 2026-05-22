"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { sessionsService } from "@/services/sessions.service";
import { api } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAppModal } from "@/context/AppModalContext";
import QRCode from "qrcode";
import { toast } from "@/components/ui/Toast";
import { TableSession } from "@/types";

interface Table {
  id: string;
  number: number;
  qrCode: string;
  restaurantId: string;
  createdAt: string;
}

export function useTablesPage() {
  useRequireAuth("MANAGER");
  const { employee } = useAuthStore();
  const { showModal } = useAppModal();
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
            showModal({
              title: "QR Code não gerado",
              message: "Não foi possível gerar o QR Code desta mesa.",
              variant: "error",
            });
            toast.error("Erro ao gerar QR code.");
          } else {
            setQrCodeImage(url);
            setShowQrModal(true);
          }
        },
      );
    }
  }

  const freeTables = tables.filter((t) => !getTableSession(t.id));
  const occupiedTables = sessions.length;

  return {
    tables,
    sessions,
    loading,
    showAddModal,
    setShowAddModal,
    newTableNumber,
    setNewTableNumber,
    adding,
    showQrModal,
    setShowQrModal,
    selectedTableId,
    qrCodeImage,
    qrCanvasRef,
    restaurantId,
    freeTables,
    occupiedTables,
    loadData,
    handleAddTable,
    handleDeleteTable,
    getTableSession,
    getSessionTotal,
    openQrModal,
  };
}
