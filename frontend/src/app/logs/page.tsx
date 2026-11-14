import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScrollText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            Nhật Ký Xuất Bản & Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Tra cứu log xuất bản Facebook (Simulation / Live) và lịch sử thao tác hệ thống
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Về Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Trang Nhật Ký Hoạt Động (Activity Logs)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Bao gồm bảng tra cứu Publishing Logs (tương ứng với schema PublishingLog: contentId, logStatus, logMessage, publishingMode, facebookPostId, loggedAt).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border border-dashed rounded-lg bg-muted/20">
            <ScrollText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              Module: Nhật ký hoạt động & Publishing Logs
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
