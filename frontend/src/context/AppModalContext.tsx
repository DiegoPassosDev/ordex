"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type AppModalVariant = "info" | "success" | "warning" | "error";

interface AppModalState {
  title: string;
  message: string;
  variant: AppModalVariant;
}

interface AppModalContextValue {
  showModal: (modal: Partial<AppModalState> & { message: string }) => void;
  hideModal: () => void;
}

const AppModalContext = createContext<AppModalContextValue | null>(null);

const VARIANT_CLASS: Record<AppModalVariant, string> = {
  info: "border-blue-500/30 bg-blue-500/10 text-blue-100",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  error: "border-red-500/30 bg-red-500/10 text-red-100",
};

export function AppModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<AppModalState | null>(null);

  const hideModal = useCallback(() => setModal(null), []);

  const showModal = useCallback(
    (nextModal: Partial<AppModalState> & { message: string }) => {
      setModal({
        title: nextModal.title ?? "Atenção",
        message: nextModal.message,
        variant: nextModal.variant ?? "info",
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ showModal, hideModal }),
    [hideModal, showModal],
  );

  return (
    <AppModalContext.Provider value={value}>
      {children}
      {modal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-modal-title"
        >
          <div className="w-full max-w-sm rounded-lg border border-white/10 bg-gray-950 p-5 shadow-2xl">
            <div className={`rounded-md border p-3 ${VARIANT_CLASS[modal.variant]}`}>
              <h2 id="app-modal-title" className="text-base font-semibold">
                {modal.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-200">
                {modal.message}
              </p>
            </div>
            <button
              type="button"
              onClick={hideModal}
              className="mt-4 w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-950 transition hover:bg-gray-200"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </AppModalContext.Provider>
  );
}

export function useAppModal() {
  const context = useContext(AppModalContext);
  if (!context) {
    throw new Error("useAppModal deve ser usado dentro de AppModalProvider");
  }
  return context;
}
