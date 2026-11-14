import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Workflow, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Workflow className="w-5 h-5 text-primary" />
            Quy Trình Tự Động Hóa n8n
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Giám sát 3 kịch bản: WF01 (Sinh nội dung), WF02 (Duyệt y khoa), WF03 (Đăng bài Facebook)
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
            Trang Quản lý Quy trình n8n (n8n Workflows)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Bao gồm trạng thái thời gian thực, kích hoạt webhook thủ công, theo dõi tỷ lệ thành công của các node trong luồng n8n.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border border-dashed rounded-lg bg-muted/20">
            <Workflow className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              Module: Điều phối quy trình n8n
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
