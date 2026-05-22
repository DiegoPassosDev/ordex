"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export function useStockReportsPage() {
  const { employee } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"margin" | "profit" | "cost">("margin");

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      setLoading(true);
      const { data } = await api.get(`/stock/report/profit/${restaurantId}`);
      setReport(data);
    } catch {
      toast.error("Erro ao carregar relatório.");
    } finally {
      setLoading(false);
    }
  }

  const sorted = [...report].sort((a, b) => b[sortBy] - a[sortBy]);
  const withRecipe = report.filter((i) => i.hasRecipe);
  const avgMargin =
    withRecipe.length > 0
      ? withRecipe.reduce((acc, i) => acc + i.margin, 0) / withRecipe.length
      : 0;
  const totalProfit = withRecipe.reduce((acc, i) => acc + i.profit, 0);

  return {
    report,
    loading,
    sortBy,
    setSortBy,
    sorted,
    withRecipe,
    avgMargin,
    totalProfit,
    restaurantId,
  };
}
