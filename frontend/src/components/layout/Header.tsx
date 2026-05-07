'use client';

import { Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { guest, employee, clearAuth } = useAuthStore();
  const router = useRouter();

  const name = employee?.name || guest?.name || 'Usuário';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Olá, {name.split(' ')[0]}!
        </h1>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative w-10 h-10 rounded-xl bg-gray-800 border border-gray-600 shadow-sm flex items-center justify-center text-gray-400 hover:bg-gray-600 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
          <span className="text-white font-semibold text-sm">{initials}</span>
        </div>

        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-600 shadow-sm flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
