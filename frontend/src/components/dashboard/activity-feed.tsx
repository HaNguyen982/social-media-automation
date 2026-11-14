import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivitySummaryItem } from "@/types/dashboard";
import { formatRelativeTime } from "@/lib/utils";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Share2,
  Clock,
} from "lucide-react";

export function ActivityFeed({ activities }: { activities: ActivitySummaryItem[] }) {
  const getIcon = (type: string, status: string) => {
    switch (type) {
      case "generate":
        return <Sparkles className="w-3.5 h-3.5 text-blue-500" />;
      case "review":
        return status === "warning" ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        );
      case "publish":
        return <Share2 className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <CheckCircle className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Nhật Ký Sự Kiện Thời Gian Thực
          </CardTitle>
          <Badge
            variant="outline"
            className="text-[10px] font-normal border-slate-300 dark:border-slate-700 text-muted-foreground bg-muted/30"
          >
            Dữ liệu mô phỏng
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Các thao tác sinh bài của n8n, thẩm định y khoa & phát hành
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-1">
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-border">
          {activities.map((act) => (
            <div key={act.id} className="relative group">
              {/* Dot Icon on Timeline */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center shadow-xs">
                {getIcon(act.type, act.status)}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {act.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(act.timestamp)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {act.description}
                </p>
                <span className="text-[10px] font-mono text-slate-400 mt-1">
                  Tác tử: {act.userOrAgent}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
