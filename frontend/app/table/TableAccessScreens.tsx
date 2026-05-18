"use client";

import { Loader2, UserCheck, UserX, QrCode } from "lucide-react";

// ── Tela de espera (Cliente B aguardando autorização) ─────────────────────────
export function WaitingForAccessScreen({
  ownerName,
}: {
  ownerName: string | null;
}) {
  return (
    <div className="min-h-screen bg-gray-900 w-full max-w-md mx-auto flex flex-col items-center justify-center px-8 gap-6">
      <div className="w-20 h-20 rounded-3xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          Aguardando autorização
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          {ownerName
            ? `Peça para ${ownerName} autorizar seu acesso à mesa.`
            : "Aguarde a autorização do responsável pela mesa."}
        </p>
      </div>
      <div className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
        <p className="text-xs text-gray-400">
          Uma notificação foi enviada para{" "}
          <span className="text-white font-medium">
            {ownerName || "o responsável"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ── Tela de acesso negado ─────────────────────────────────────────────────────
export function AccessDeniedScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-900 w-full max-w-md mx-auto flex flex-col items-center justify-center px-8 gap-6">
      <div className="w-20 h-20 rounded-3xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
        <UserX className="w-10 h-10 text-red-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Acesso negado</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          O responsável pela mesa não autorizou seu acesso.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-800 border border-gray-700 text-gray-300 font-medium text-sm hover:bg-gray-700 transition-all"
      >
        <QrCode className="w-4 h-4" />
        Tentar outra mesa
      </button>
    </div>
  );
}

// ── Modal de solicitação de acesso (aparece para o dono) ──────────────────────
export function AccessRequestModal({
  guestName,
  onApprove,
  onDeny,
}: {
  guestName: string;
  onApprove: () => void;
  onDeny: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-sm bg-gray-800 border border-gray-700 rounded-3xl p-6 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <UserCheck className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Alguém quer entrar na mesa
            </h3>
            <p className="text-gray-400 text-sm mt-1 leading-relaxed">
              <span className="text-white font-semibold">{guestName}</span> quer
              se juntar à sua mesa. Deseja autorizar?
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDeny}
            className="flex-1 py-3 rounded-2xl bg-gray-700 border border-gray-600 text-gray-300 font-medium text-sm hover:bg-gray-600 transition-all"
          >
            Recusar
          </button>
          <button
            onClick={onApprove}
            className="flex-1 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all"
          >
            Autorizar
          </button>
        </div>
      </div>
    </div>
  );
}
