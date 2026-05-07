import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  LayoutGrid,
  ClipboardList,
  Users,
  UtensilsCrossed,
  TrendingUp,
  Settings,
  ChefHat,
  Boxes,
} from "lucide-react";

const navItems = [
  { href: "/manager", icon: LayoutGrid, label: "Dashboard" },
  { href: "/manager/tables", icon: UtensilsCrossed, label: "Mesas" },
  { href: "/manager/orders", icon: ClipboardList, label: "Pedidos" },
  { href: "/manager/menu", icon: ChefHat, label: "Cardápio" },
  { href: "/manager/employees", icon: Users, label: "Equipe" },
  { href: "/manager/stock", icon: Boxes, label: "Estoque" },
  { href: "/manager/reports", icon: TrendingUp, label: "Relatórios" },
  { href: "/manager/settings", icon: Settings, label: "Configurações" },
];

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-900 overflow-hidden">
      <Sidebar items={navItems} />

      <main className="flex-1 w-full md:ml-16 md:w-[calc(100%-64px)] overflow-y-auto overflow-x-hidden">
        <div className="w-full min-h-screen px-4 sm:px-6 xl:px-10 py-5 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
