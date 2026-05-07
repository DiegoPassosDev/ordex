import {
  OrderStatus,
  ORDER_STATUS_DOT,
  ORDER_STATUS_LABEL,
} from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

// Dark-friendly colors (replaces the light bg-*-100 variants)
const ORDER_STATUS_COLOR_DARK: Record<OrderStatus, string> = {
  WAITING:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  PREPARING:  "bg-blue-500/15   text-blue-400   border-blue-500/30",
  READY:      "bg-green-500/15  text-green-400  border-green-500/30",
  ON_THE_WAY: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  DELIVERED:  "bg-gray-700      text-gray-400   border-gray-600",
  CANCELLED:  "bg-red-500/15    text-red-400    border-red-500/30",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
        ORDER_STATUS_COLOR_DARK[status],
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", ORDER_STATUS_DOT[status])} />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
