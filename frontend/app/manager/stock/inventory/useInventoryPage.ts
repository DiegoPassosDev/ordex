"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

type SortKey = "name" | "quantity" | "costPerUnit" | "totalValue";

export function useInventoryPage() {
  const { employee } = useAuthStore();
  const restaurantId =
    employee?.restaurantId || "f4385ae5-6187-40f8-97b4-d289d47dc441";

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [filterLow, setFilterLow] = useState(false);

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

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const items: any[] = report?.items ?? [];

  const filtered = items
    .filter((item) => {
      const matchSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchLow = filterLow
        ? item.minQuantity > 0 && item.quantity <= item.minQuantity
        : true;
      return matchSearch && matchLow;
    })
    .sort((a, b) => {
      let valA: any;
      let valB: any;
      if (sortKey === "totalValue") {
        valA = a.quantity * a.costPerUnit;
        valB = b.quantity * b.costPerUnit;
      } else {
        valA = a[sortKey];
        valB = b[sortKey];
      }
      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });

  return {
    report,
    loading,
    search,
    setSearch,
    sortKey,
    sortAsc,
    filterLow,
    setFilterLow,
    items,
    filtered,
    restaurantId,
    loadReport,
    toggleSort,
  };
}
