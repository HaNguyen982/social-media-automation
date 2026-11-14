import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Cài Đặt Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Cấu hình kết nối NestJS Backend API, n8n webhook, mô hình Ollama và chính sách kiểm duyệt
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
            Trang Cài Đặt Hệ Thống (Settings)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Quản trị URL API (`NEXT_PUBLIC_API_URL`), lựa chọn chế độ Dữ liệu mẫu (Mock mode) / Trực tuyến (Live API), cấu hình bộ lọc an toàn y khoa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border border-dashed rounded-lg bg-muted/20">
            <Settings className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              Module: Cấu hình hệ thống & Kết nối API
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
