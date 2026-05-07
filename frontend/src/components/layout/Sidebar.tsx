"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, Menu, X } from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

interface SidebarProps {
  items: NavItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const renderNavItems = (mobile = false) =>
    items.map((item) => {
      const Icon = item.icon;
      const active =
        item.href === "/manager"
          ? pathname === "/manager"
          : pathname.startsWith(item.href);

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => mobile && setOpen(false)}
          className={`group relative flex h-12 items-center rounded-2xl transition-all duration-200 ${
            mobile ? "w-full justify-start gap-3 px-3" : "w-full justify-center"
          } ${
            active
              ? "bg-orange-500/20 text-orange-400"
              : "text-gray-400 hover:bg-gray-700 hover:text-white"
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {mobile ? (
            <span className="text-sm font-medium">{item.label}</span>
          ) : (
            <span className="pointer-events-none absolute left-[78px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
              {item.label}
            </span>
          )}
        </Link>
      );
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-700 bg-gray-800 text-gray-200 shadow-lg md:hidden"
        aria-label="Abrir navegacao"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar navegacao"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />

          <aside className="relative flex h-full w-64 flex-col border-r border-gray-700 bg-gray-800 px-3 py-4 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500">
                  <span className="text-lg font-bold text-white">O</span>
                </div>
                <span className="text-sm font-semibold text-white">Ordex</span>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-700 hover:text-white"
                aria-label="Fechar navegacao"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-2">{renderNavItems(true)}</nav>
          </aside>
        </div>
      )}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-16 flex-col items-center border-r border-gray-700 bg-gray-800 py-6 md:flex">
        <div className="mb-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500">
          <span className="text-lg font-bold text-white">O</span>
        </div>

        <nav className="flex w-full flex-1 flex-col items-center gap-4 px-2">
          {renderNavItems()}
        </nav>
      </aside>
    </>
  );
}
