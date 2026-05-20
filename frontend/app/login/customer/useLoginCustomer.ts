"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export function useLoginCustomer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId");

  const { setGuestAuth } = useAuthStore();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleMode() {
    setIsRegister((v) => !v);
    setForm({ name: "", email: "", password: "" });
  }

  async function handleSubmit() {
    if (!form.email || !form.password) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (isRegister && !form.name) {
      toast.error("Informe seu nome.");
      return;
    }

    setLoading(true);
    try {
      let token = "";
      let guestId = "";
      let guestName = "";

      if (isRegister) {
        const data = await authService.register(
          form.name,
          form.email,
          form.password,
        );
        token = data.accessToken;
        const payload = JSON.parse(atob(token.split(".")[1]));
        guestId = payload.sub;
        guestName = form.name;
      } else {
        const data = await authService.login(form.email, form.password);
        token = data.accessToken;
        const payload = JSON.parse(atob(token.split(".")[1]));
        guestId = payload.sub;
        try {
          const guestData = await api.get(`/guests/${guestId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          guestName = guestData.data.name || form.email;
        } catch {
          guestName = form.email;
        }
      }

      setGuestAuth(token, { id: guestId, name: guestName, email: form.email });
      toast.success(`Bem-vindo, ${guestName.split(" ")[0]}!`);

      // Se veio com tableId na URL, redireciona já com a mesa identificada
      if (tableId) {
        router.push(`/table?tableId=${tableId}`);
      } else {
        router.push("/table");
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || "Credenciais inválidas.";
      toast.error(Array.isArray(message) ? message[0] : message, {
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    form,
    loading,
    isRegister,
    tableId,
    handleChange,
    handleSubmit,
    toggleMode,
  };
}
