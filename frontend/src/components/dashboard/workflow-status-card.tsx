import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkflowItem } from "@/types/workflow";
import { formatRelativeTime } from "@/lib/utils";
import { ArrowUpRight, Cpu, CheckCircle2, PlayCircle } from "lucide-react";

export function WorkflowStatusCard({ workflows }: { workflows: WorkflowItem[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              Hệ Thống n8n Tự Động
            </CardTitle>
            <Badge
              variant="outline"
              className="text-[10px] font-normal border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-500/10"
            >
              Mô phỏng hạ tầng n8n
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Kịch bản n8n WF01, WF02, WF03 điều phối cùng mô hình Ollama
          </CardDescription>
        </div>
        <Link href="/workflows">
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-8">
            Chi tiết
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {workflows.map((wf) => {
          return (
            <div
              key={wf.id}
              className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {wf.code}
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate max-w-[150px] sm:max-w-[200px]">
                    {wf.vietnameseName}
                  </span>
                </div>
                <Badge
                  variant="success"
                  className="text-[10px] h-5 gap-1 font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang chạy
                </Badge>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Tỷ lệ thành công: {wf.successRate}%
                </span>
                <span className="truncate">
                  Chạy gần nhất: {formatRelativeTime(wf.lastRunAt)}
                </span>
              </div>
            </div>
          );
        })}

        <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-medium">
            <PlayCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Lần chạy tự động tiếp theo: 15:30 (Đăng Fanpage)
          </span>
          <span className="font-mono text-[10px] uppercase font-bold">Auto</span>
        </div>
      </CardContent>
    </Card>
  );
}
