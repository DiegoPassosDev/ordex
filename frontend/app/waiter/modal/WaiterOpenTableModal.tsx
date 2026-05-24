"use client";

import { useState, useEffect, useId } from "react";
import {
  X,
  Camera,
  Loader2,
  User,
  ArrowLeft,
  ClipboardList,
  Table2,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { SlideUpModal, useSlideUpClose } from "@/components/ui/SlideUpModal";
import { sessionsService } from "@/services/sessions.service";
import type { Table } from "@/types";

function getTableIdFromQrValue(value: string) {
  const decodedText = value.trim();
  try {
    const url = new URL(decodedText);
    const tableId = url.searchParams.get("tableId");
    if (tableId) return tableId;
    const [route, id] = url.pathname.split("/").filter(Boolean);
    if (route === "table" && id) return id;
  } catch {}
  return decodedText;
}

interface WaiterOpenTableModalProps {
  restaurantId: string;
  waiterId: string;
  onOpen: (tableId: string, guestName: string) => Promise<void>;
  onClose: () => void;
}

type Step = "choose" | "select" | "scan" | "name";

function Inner({
  restaurantId,
  waiterId,
  onOpen,
}: WaiterOpenTableModalProps) {
  const { close } = useSlideUpClose();
  const [step, setStep] = useState<Step>("choose");
  const [scannedTableId, setScannedTableId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  useEffect(() => {
    if (step === "choose") {
      loadAvailableTables();
    }
  }, [step]);

  async function loadAvailableTables() {
    setLoadingTables(true);
    try {
      const data = await sessionsService.getTablesByRestaurant(
        restaurantId,
        true,
      );
      setTables(data);
    } catch {
      toast.error("Erro ao carregar mesas.");
    } finally {
      setLoadingTables(false);
    }
  }

  function handleSelectTable(table: Table) {
    setScannedTableId(table.id);
    setStep("name");
  }

  function handleScan(tableId: string) {
    setScannedTableId(tableId);
    setStep("name");
  }

  async function handleConfirm() {
    if (!scannedTableId) return;
    setSaving(true);
    try {
      await onOpen(scannedTableId, customerName.trim());
      toast.success("Mesa aberta com sucesso!");
      close();
    } catch {
      toast.error("Erro ao abrir mesa.");
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    if (step === "name") {
      if (scannedTableId && tables.some((t) => t.id === scannedTableId)) {
        setStep("select");
      } else {
        setStep("scan");
      }
      setScannedTableId(null);
      setCustomerName("");
    } else if (step === "select" || step === "scan") {
      setStep("choose");
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0 mb-5">
        <div className="flex items-center gap-2">
          {step !== "choose" && (
            <button
              onClick={goBack}
              className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-gray-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h3 className="font-bold text-white text-lg">
            {step === "choose" && "Abrir Mesa"}
            {step === "select" && "Selecionar Mesa"}
            {step === "scan" && "Ler QR Code"}
            {step === "name" && "Nome do Cliente"}
          </h3>
        </div>
        <button onClick={close}>
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

        {/* Step: Choose */}
        {step === "choose" && (
          <div className="flex flex-col gap-4 py-4">
            <p className="text-sm text-gray-400 text-center">
              Escolha como abrir a mesa
            </p>

            <button
              onClick={() => setStep("select")}
              className="flex items-center gap-4 w-full p-5 rounded-2xl bg-gray-700/50 hover:bg-gray-700 border border-gray-600 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Selecionar da lista</p>
                <p className="text-sm text-gray-400">
                  Escolha a mesa entre as disponíveis
                </p>
              </div>
            </button>

            <button
              onClick={() => setStep("scan")}
              className="flex items-center gap-4 w-full p-5 rounded-2xl bg-gray-700/50 hover:bg-gray-700 border border-gray-600 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Ler QR Code</p>
                <p className="text-sm text-gray-400">
                  Escaneie o código da mesa
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Step: Select table from list */}
        {step === "select" && (
          <div className="flex flex-col gap-3 py-4 max-h-[60vh] overflow-y-auto">
            {loadingTables ? (
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-8">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando mesas...
              </div>
            ) : tables.length === 0 ? (
              <div className="text-center py-8">
                <Table2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  Nenhuma mesa disponível no momento
                </p>
              </div>
            ) : (
              tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleSelectTable(table)}
                  className="flex items-center gap-4 w-full p-4 rounded-2xl bg-gray-700/50 hover:bg-gray-700 border border-gray-600 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center shrink-0">
                    <Table2 className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      Mesa {table.number}
                    </p>
                    <p className="text-xs text-gray-500">Disponível</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step: Scan QR Code */}
        {step === "scan" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-gray-400 text-center">
              Escaneie o QR Code da mesa para abri-la
            </p>
            <QrScanner onScan={handleScan} />
          </div>
        )}

        {/* Step: Enter customer name */}
        {step === "name" && (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-2xl">
              {scannedTableId && tables.some((t) => t.id === scannedTableId) ? (
                <Table2 className="w-5 h-5 text-orange-400 shrink-0" />
              ) : (
                <Camera className="w-5 h-5 text-orange-400 shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  Mesa {tables.find((t) => t.id === scannedTableId)?.number || "identificada"}
                </p>
                <p className="text-xs text-gray-400">
                  ID: {scannedTableId?.slice(0, 8)}...
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                Nome do cliente <span className="text-gray-500">(opcional)</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  placeholder="Ex: João"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                O cliente fará o próprio check-in ao escanear o QR Code
              </p>
            </div>

            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <User className="w-4 h-4" />
              )}
              {saving ? "Abrindo..." : "Abrir Mesa"}
            </button>
          </div>
        )}
    </>
  );
}

export function WaiterOpenTableModal(props: WaiterOpenTableModalProps) {
  return (
    <SlideUpModal onClose={props.onClose} className="p-6 max-h-[90vh] overflow-auto">
      <Inner {...props} />
    </SlideUpModal>
  );
}

/* ── QR Scanner interno ────────────────────────────────────────────────── */
function QrScanner({ onScan }: { onScan: (tableId: string) => void }) {
  const reactId = useId();
  const containerId = `qr-waiter-${reactId.replace(/:/g, "")}`;
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let scanner: any;
    let started = false;
    let cancelled = false;

    function clearContainer() {
      document.getElementById(containerId)?.replaceChildren();
    }

    async function startScanner() {
      try {
        clearContainer();
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        scanner = new Html5Qrcode(containerId);
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            const tableId = getTableIdFromQrValue(decodedText);
            started = false;
            scanner.stop().catch(() => {});
            onScan(tableId);
          },
          () => {},
        );
        if (cancelled) {
          scanner.stop().catch(() => {});
          scanner.clear?.();
          clearContainer();
          return;
        }
        started = true;
        setStarting(false);
      } catch (err: any) {
        started = false;
        setError(
          err?.message?.toLowerCase().includes("permission")
            ? "Permissão de câmera negada."
            : "Não foi possível acessar a câmera.",
        );
        setStarting(false);
      }
    }

    startScanner();
    return () => {
      cancelled = true;
      if (started && scanner) {
        started = false;
        scanner.stop().then(() => scanner.clear?.()).catch(() => {}).finally(clearContainer);
      } else {
        scanner?.clear?.();
        clearContainer();
      }
    };
  }, [containerId]);

  if (error) {
    return (
      <div className="w-full rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {starting && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Iniciando câmera...
        </div>
      )}
      <div
        id={containerId}
        className="mx-auto aspect-square w-[min(70vw,260px)] rounded-2xl overflow-hidden bg-black"
      />
    </div>
  );
}
