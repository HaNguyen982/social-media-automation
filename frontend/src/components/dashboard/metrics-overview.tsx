import {
  FileText,
  Clock,
  ShieldCheck,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MetricItem {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  description: string;
  icon: string;
  badge?: string;
  badgeVariant?: "success" | "warning" | "info" | "neutral";
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Clock,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  XCircle,
  AlertCircle,
};

export function MetricsOverview({ metrics }: { metrics: MetricItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, idx) => {
        const IconComponent = iconMap[m.icon] || FileText;
        const isUp = m.trend === "up";

        return (
          <Card key={idx} className="relative overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {m.title}
                </span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {m.value}
                </span>

                {m.badge ? (
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap",
                      m.badgeVariant === "success"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : m.badgeVariant === "warning"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : m.badgeVariant === "info"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                    )}
                  >
                    {m.badge}
                  </span>
                ) : m.change !== undefined ? (
                  <div
                    className={cn(
                      "flex items-center text-xs font-semibold px-1.5 py-0.5 rounded",
                      isUp
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {isUp ? (
                      <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-0.5" />
                    )}
                    {Math.abs(m.change)}%
                  </div>
                ) : null}
              </div>

              <p className="mt-1 text-xs text-muted-foreground truncate">
                {m.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
