import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Share2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Tài Khoản Mạng Xã Hội
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Quản lý kết nối Facebook Fanpages, Instagram Business và các kênh phân phối
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
            Trang Tài Khoản Mạng Xã Hội (Social Accounts)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Quản lý Page Access Tokens, phân quyền xuất bản và theo dõi lượng người theo dõi các kênh vệ tinh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border border-dashed rounded-lg bg-muted/20">
            <Share2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              Module: Kết nối Fanpage & Kênh phân phối
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
