import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Employee, Guest } from "@/types";

function setCookie(value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `ordex_auth=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

function deleteCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "ordex_auth=; path=/; max-age=0";
}

interface AuthState {
  token: string | null;
  guest: Guest | null;
  employee: Employee | null;
  restaurantId: string | null;
  sessionId: string | null;
  tableId: string | null;
  tableNumber: string | null;
  _hasHydrated: boolean; // ← novo

  setGuestAuth: (
    token: string,
    guest: Guest,
    restaurantId?: string,
    sessionId?: string,
  ) => void;
  setEmployeeAuth: (token: string, employee: Employee) => void;
  setSessionId: (sessionId: string) => void;
  setTableId: (tableId: string, restaurantId?: string) => void;
  setTableNumber: (number: string) => void;
  setHasHydrated: (v: boolean) => void; // ← novo
  logout: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      guest: null,
      employee: null,
      restaurantId: null,
      sessionId: null,
      tableId: null,
      tableNumber: null,
      _hasHydrated: false, // ← novo

      setGuestAuth: (token, guest, restaurantId, sessionId) => {
        set({
          token,
          guest,
          employee: null,
          restaurantId: restaurantId || null,
          sessionId: sessionId || null,
        });
        setCookie(JSON.stringify({ state: { token, guest, employee: null } }));
      },

      setEmployeeAuth: (token, employee) => {
        set({
          token,
          employee,
          guest: null,
          restaurantId: employee.restaurantId,
          sessionId: null,
        });
        setCookie(JSON.stringify({ state: { token, employee, guest: null } }));
      },

      setSessionId: (sessionId) => set({ sessionId }),

      setTableId: (tableId) => set({ tableId }),

      setTableNumber: (tableNumber) => set({ tableNumber }),

      setHasHydrated: (v) => set({ _hasHydrated: v }), // ← novo

      logout: () => {
        set({
          token: null,
          guest: null,
          employee: null,
          restaurantId: null,
          sessionId: null,
          tableId: null,
          tableNumber: null,
        });
        deleteCookie();
      },

      clearAuth: () => {
        set({
          token: null,
          guest: null,
          employee: null,
          restaurantId: null,
          sessionId: null,
          tableId: null,
          tableNumber: null,
        });
        deleteCookie();
      },
    }),
    {
      name: "ordex_auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true); // ← dispara quando o localStorage termina de ser lido
      },
    },
  ),
);
export const useAuthStoreHydrated = () => useAuthStore((s) => s._hasHydrated);
