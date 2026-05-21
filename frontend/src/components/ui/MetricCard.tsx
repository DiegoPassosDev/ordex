import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'orange' | 'blue' | 'green' | 'purple' | 'yellow';
  subtitle?: string;
}

const colorMap = {
  orange: { bg: 'bg-orange-500/15', icon: 'text-orange-400', ring: 'ring-orange-500/20' },
  blue:   { bg: 'bg-blue-500/15',   icon: 'text-blue-400',   ring: 'ring-blue-500/20'   },
  green:  { bg: 'bg-green-500/15',  icon: 'text-green-400',  ring: 'ring-green-500/20'  },
  purple: { bg: 'bg-purple-500/15', icon: 'text-purple-400', ring: 'ring-purple-500/20' },
  yellow: { bg: 'bg-yellow-500/15', icon: 'text-yellow-400', ring: 'ring-yellow-500/20' },
};

export function MetricCard({ title, value, icon: Icon, color, subtitle }: MetricCardProps) {
  const colors = colorMap[color];

  return (
    <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 p-5 flex items-center gap-4">
      <div className={cn('w-14 h-14 rounded-full flex items-center justify-center ring-4', colors.bg, colors.ring)}>
        <Icon className={cn('w-6 h-6', colors.icon)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
