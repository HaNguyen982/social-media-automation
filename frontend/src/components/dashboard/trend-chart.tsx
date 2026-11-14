"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PublicationTrendPoint } from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";

export function TrendChart({ data }: { data: PublicationTrendPoint[] }) {
  const maxPosts = Math.max(...data.map((d) => d.posts), 30);

  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                Tần Suất Xuất Bản & Thẩm Định Tuần Qua
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[10px] font-normal border-slate-300 dark:border-slate-700 text-muted-foreground bg-muted/30"
              >
                Dữ liệu mô phỏng
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Thống kê lượng bài viết dự kiến tạo bởi n8n và tỷ lệ bác sĩ phê duyệt theo ngày
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 dark:bg-blue-500" />
              Tổng bài tạo
            </span>
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              Đạt y khoa
            </span>
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
              Cần sửa lại
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-64 w-full flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-border">
          {data.map((item, idx) => {
            const heightPercent = Math.round((item.posts / maxPosts) * 100);
            const approvedHeight = Math.round((item.approved / maxPosts) * 100);
            const rejectedHeight = Math.round((item.rejected / maxPosts) * 100);

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              >
                {/* Tooltip on Hover */}
                <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-popover text-popover-foreground text-[11px] py-1.5 px-2.5 rounded shadow-lg border border-border whitespace-nowrap pointer-events-none transition-all">
                  <span className="font-semibold">{item.date}</span>
                  <span>
                    Tạo: {item.posts} | Duyệt: {item.approved} | Lỗi: {item.rejected}
                  </span>
                </div>

                {/* Bars group */}
                <div className="w-full max-w-[42px] flex items-end justify-center gap-1 h-full">
                  {/* Total posts bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-1/3 bg-blue-600/80 dark:bg-blue-500/80 rounded-t-sm transition-all group-hover:opacity-100 opacity-85"
                  />
                  {/* Approved bar */}
                  <div
                    style={{ height: `${approvedHeight}%` }}
                    className="w-1/3 bg-emerald-500/80 rounded-t-sm transition-all group-hover:opacity-100 opacity-85"
                  />
                  {/* Rejected bar */}
                  {item.rejected > 0 && (
                    <div
                      style={{ height: `${Math.max(rejectedHeight, 4)}%` }}
                      className="w-1/3 bg-rose-400/80 rounded-t-sm transition-all group-hover:opacity-100 opacity-85"
                    />
                  )}
                </div>

                {/* Date label */}
                <span className="text-[11px] font-medium text-muted-foreground mt-3 truncate">
                  {item.date}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Trung bình kế hoạch: 18 bài viết / ngày</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            (Dữ liệu dự kiến điều phối)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
