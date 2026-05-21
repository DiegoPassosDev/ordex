"use client";

import { AlertCircle } from "lucide-react";

interface Props {
  onCancel: () => void;
  onConfirm: () => void;
}

export function CloseConfirmModal({ onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-gray-800 border border-gray-700 rounded-3xl p-6 flex flex-col gap-4">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-1">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Encerrar mesa?</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            A sessão será encerrada e os clientes serão notificados.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-gray-700 border border-gray-600 text-gray-300 font-medium text-sm hover:bg-gray-600 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-medium text-sm transition-all"
          >
            Encerrar
          </button>
        </div>
      </div>
    </div>
  );
}
