"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export function useStockDashboardPage() {
  const { employee } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      setLoading(true);
      const { data } = await api.get(`/stock/report/stock/${restaurantId}`);
      setReport(data);
    } catch {
      toast.error("Erro ao carregar estoque.");
    } finally {
      setLoading(false);
    }
  }

  return {
    report,
    loading,
    restaurantId,
  };
}
