import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

type RequiredRole = "MANAGER" | "WAITER" | "KITCHEN" | "BAR" | "guest";

export function useRequireAuth(role: RequiredRole) {
  const { token, employee } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const persistedAuth = window.localStorage.getItem("ordex_auth");
    const authCookie = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("ordex_auth="));

    if (!token && !persistedAuth && !authCookie) {
      router.replace("/login");
      return;
    }

    if (!token && (persistedAuth || authCookie)) {
      return;
    }

    if (role === "guest" && employee) {
      router.replace("/login");
      return;
    }

    if (role !== "guest" && (!employee || employee.role !== role)) {
      router.replace("/login");
      return;
    }
  }, [token, employee]);
}
