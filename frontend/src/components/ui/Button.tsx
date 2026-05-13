import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  loading?: boolean;
}

const variantMap = {
  primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-sm",
  secondary:
    "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 shadow-sm",
  danger: "bg-red-500 hover:bg-red-600 text-white shadow-sm",
  ghost: "hover:bg-gray-700 text-gray-400 hover:text-gray-200",
};

const sizeMap = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium leading-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        variantMap[variant],
        sizeMap[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span className="inline-flex items-center leading-none">{children}</span>
    </button>
  );
}
