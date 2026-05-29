"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

const TERMINAL_STATUSES = new Set(["READY", "DELIVERED", "CANCELLED"]);

export function ItemTimer({
  date,
  prepTime,
  status,
  statusChangedAt,
}: {
  date: string;
  prepTime: number;
  status?: string;
  statusChangedAt?: string | null;
}) {
  const [minutes, setMinutes] = useState(0);
  const [mounted, setMounted] = useState(false);
  const frozenRef = useRef<number | null>(null);

  const isTerminal = status ? TERMINAL_STATUSES.has(status) : false;

  useEffect(() => {
    setMounted(true);

    if (isTerminal) {
      if (statusChangedAt) {
        const elapsed = Math.floor(
          (new Date(statusChangedAt).getTime() - new Date(date).getTime()) / 60000,
        );
        frozenRef.current = Math.max(0, elapsed);
      } else if (frozenRef.current === null) {
        frozenRef.current = Math.max(
          0,
          Math.floor((Date.now() - new Date(date).getTime()) / 60000),
        );
      }
      setMinutes(frozenRef.current);
      return;
    }

    frozenRef.current = null;
    const calc = () =>
      setMinutes(Math.floor((Date.now() - new Date(date).getTime()) / 60000));
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [date, isTerminal, statusChangedAt]);

  if (!mounted) return null;

  const ratio = prepTime > 0 ? minutes / prepTime : 0;
  const isLate = ratio >= 1;
  const isWarning = ratio >= 0.8;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
        isLate
          ? "bg-red-500/20 text-red-400 border border-red-500/30"
          : isWarning
            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
            : "bg-gray-700 text-gray-400 border border-gray-600"
      }`}
    >
      <Clock className="w-2.5 h-2.5" />
      {minutes}/{prepTime} min
    </span>
  );
}
