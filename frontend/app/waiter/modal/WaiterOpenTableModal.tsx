"use client";

import { useState, useId, useEffect } from "react";
import { X, Camera, Loader2, User, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/Toast";

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

export function WaiterOpenTableModal({
  restaurantId,
  waiterId,
  onOpen,
  onClose,
}: WaiterOpenTableModalProps) {
  const [step, setStep] = useState<"scan" | "name">("scan");
  const [scannedTableId, setScannedTableId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [saving, setSaving] = useState(false);

  function handleScan(tableId: string) {
    setScannedTableId(tableId);
    setStep("name");
  }

  async function handleConfirm() {
    if (!scannedTableId || !customerName.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    setSaving(true);
    try {
      await onOpen(scannedTableId, customerName.trim());
      toast.success("Mesa aberta com sucesso!");
      onClose();
    } catch {
      toast.error("Erro ao abrir mesa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto bg-gray-800 border-t border-gray-700 rounded-t-3xl p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {step === "name" && (
              <button
                onClick={() => {
                  setStep("scan");
                  setScannedTableId(null);
                }}
                className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-gray-300"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h3 className="font-bold text-white text-lg">
              {step === "scan" ? "Abrir Mesa" : "Nome do Cliente"}
            </h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {step === "scan" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-gray-400 text-center">
              Escaneie o QR Code da mesa para abri-la
            </p>
            <QrScanner onScan={handleScan} />
          </div>
        )}

        {step === "name" && (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-2xl">
              <Camera className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Mesa identificada</p>
                <p className="text-xs text-gray-400">
                  ID: {scannedTableId?.slice(0, 8)}...
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                Nome do cliente
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
                Apenas para identificação da mesa
              </p>
            </div>

            <button
              onClick={handleConfirm}
              disabled={saving || !customerName.trim()}
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
      </div>
    </div>
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
