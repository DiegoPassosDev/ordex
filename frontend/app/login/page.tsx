"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { api } from "@/lib/api";
import {
  LogIn,
  ChefHat,
  UtensilsCrossed,
  ClipboardList,
  Users,
} from "lucide-react";
import { CustomToaster, toast } from "@/components/ui/Toast";
import { ThemeToggle } from "@/components/theme/ThemeProvider";

export default function LoginPage() {
  const router = useRouter();
  const { setGuestAuth, setEmployeeAuth } = useAuthStore();

  const [mode, setMode] = useState<"guest" | "employee">("guest");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit() {
    if (!form.email || !form.password) {
      toast.error("Preencha todos os campos.");
      return;
    }

    if (mode === "guest" && isRegister && !form.name) {
      toast.error("Informe seu nome.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "guest") {
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

        setGuestAuth(token, {
          id: guestId,
          name: guestName,
          email: form.email,
        });
        toast.success(`Bem-vindo, ${guestName.split(" ")[0]}!`);
        router.push("/table");
      } else {
        const data = await authService.employeeLogin(form.email, form.password);
        setEmployeeAuth(data.accessToken, data.employee);

        const roleRoutes: Record<string, string> = {
          MANAGER: "/manager",
          WAITER: "/waiter",
          KITCHEN: "/kitchen",
          BAR: "/kitchen",
        };

        toast.success(`Bem-vindo, ${data.employee.name.split(" ")[0]}!`);
        router.push(roleRoutes[data.employee.role] || "/manager");
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || "Credenciais inválidas.";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-600 bg-gray-800 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition";

  return (
    <div className="h-screen flex overflow-hidden">
      <CustomToaster />

      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* ── Lado Esquerdo ──  */}
      <div
        className="hidden lg:flex lg:w-3/5 relative overflow-hidden flex-col p-16 h-full min-h-screen"
        style={{
          background:
            "linear-gradient(135deg, var(--grad-end) 0%, var(--grad-mid) 50%, var(--grad-start) 100%)",
        }}
      >
        {/* Círculos decorativos de fundo */}
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full bg-gray-400/20" />
        <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full bg-gray-400/20" />
        <div className="absolute top-1/2 right-[-40px] w-40 h-40 rounded-full bg-orange-500/10" />

        <div className="relative z-10 flex flex-col justify-center flex-1 h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/30 backdrop-blur flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-orange-400" />
            </div>
            <span className="text-white text-3xl font-bold tracking-tight">
              Ordex
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl font-bold text-white leading-tight">
            Gestão de
          </h1>
          <h1 className="text-6xl font-bold text-gray-400 leading-tight mb-6">
            Restaurantes
          </h1>

          <p className="text-gray-400 text-lg leading-relaxed max-w-md">
            Gerencie pedidos, mesas e equipes com agilidade e sincronização em
            tempo real.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3 mt-10">
            {[
              { icon: UtensilsCrossed, label: "Pedidos" },
              { icon: ClipboardList, label: "Cardápio" },
              { icon: Users, label: "Equipe" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-gray-300 text-sm font-medium"
              >
                <Icon className="w-4 h-4" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lado Direito ──  */}
      <div className="w-full lg:w-2/5 bg-gray-800 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            {/* Logo mobile (só aparece em telas pequenas) */}
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-white text-xl font-bold">Ordex</span>
            </div>

            <h2 className="text-2xl font-bold text-white">
              Bem-vindo de volta
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Toggle Cliente / Funcionário
               `bg-gray-700` como fundo do container e `bg-gray-600` no botão
               ativo — ambos já mapeados no globals.css para os dois temas.    */}
          <div className="flex rounded-xl bg-gray-700 p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode("guest")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all select-none ${
                mode === "guest"
                  ? "bg-gray-600 text-orange-400 shadow-sm"
                  : "text-gray-400 active:bg-gray-600/50"
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setMode("employee")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all select-none ${
                mode === "employee"
                  ? "bg-gray-600 text-orange-400 shadow-sm"
                  : "text-gray-400 active:bg-gray-600/50"
              }`}
            >
              Funcionário
            </button>
          </div>

          {/* Formulário */}
          <div className="flex flex-col gap-4">
            {mode === "guest" && isRegister && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Nome
                </label>
                <input
                  name="name"
                  placeholder="Digite seu nome"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                E-mail
              </label>
              <input
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Digite seu e-mail"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"                
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                Senha
              </label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={form.password}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className={inputClass}
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {mode === "guest" && isRegister ? "Criar conta" : "Entrar"}
            </button>
          </div>

          {mode === "guest" && (
            <p className="text-center text-sm text-gray-400 mt-6">
              {isRegister ? "Já tem conta?" : "Não tem conta?"}{" "}
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-orange-400 font-medium hover:underline active:opacity-70 select-none"
              >
                {isRegister ? "Entrar" : "Cadastrar"}
              </button>
            </p>
          )}

          <p className="text-center text-xs text-gray-500 mt-8">
            Suporte: contato@ordex.com.br
          </p>
        </div>
      </div>
    </div>
  );
}
