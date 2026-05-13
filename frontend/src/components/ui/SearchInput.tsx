import { cn } from "@/lib/utils";
import { LucideIcon, Search } from "lucide-react";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
}

export function SearchInput({
  icon: Icon = Search,
  className,
  type = "search",
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
        <Icon className="w-4 h-4" />
      </div>
      <input
        type={type}
        className="w-full rounded-2xl bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 px-10 py-3"
        {...props}
      />
    </div>
  );
}
