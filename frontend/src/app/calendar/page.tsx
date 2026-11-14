import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Lịch Xuất Bản Nội Dung
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kế hoạch bài đăng theo tuần/tháng và các khung giờ vàng tương tác cao
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
            Trang Lịch Nội Dung (Content Calendar)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Hiển thị bài viết theo lịch biểu tương tác trực quan (Grid/Calendar view), kéo thả điều chỉnh giờ đăng bài cho các Fanpage vệ tinh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border border-dashed rounded-lg bg-muted/20">
            <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              Module: Lịch xuất bản đa kênh
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
