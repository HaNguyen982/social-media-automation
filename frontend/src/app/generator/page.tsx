"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bot,
  Workflow,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  FileText,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { TriggerWF01Response } from "@/types/workflow";

// Suggested medical topics for quick input
const QUICK_TOPICS = [
  {
    topic: "Cách chăm sóc da cho người bị chàm (eczema) vào mùa lạnh",
    title: "5 Bí quyết bảo vệ làn da nhạy cảm khi thời tiết chuyển mùa",
  },
  {
    topic: "Chế độ dinh dưỡng phòng ngừa tiểu đường thai kỳ cho mẹ bầu",
    title: "Thực đơn vàng kiểm soát đường huyết an toàn trong thai kỳ",
  },
  {
    topic: "Dấu hiệu cảnh báo sớm bệnh thoái hóa khớp gối ở người trung niên",
    title: "Nhận biết sớm cơn đau khớp gối: Đừng chủ quan khi leo cầu thang",
  },
  {
    topic: "Tầm quan trọng của giấc ngủ đối với hệ miễn dịch tim mạch",
    title: "Ngủ đủ giấc - Tấm lá chắn tự nhiên cho trái tim khỏe mạnh",
  },
];

export default function GeneratorPage() {
  const [topic, setTopic] = useState("");
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ status?: number; message: string } | null>(
    null
  );
  const [result, setResult] = useState<TriggerWF01Response | null>(null);

  const handleApplyTopic = (item: { topic: string; title: string }) => {
    setTopic(item.topic);
    setSuggestedTitle(item.title);
    setError(null);
  };

  const handleReset = () => {
    setTopic("");
    setSuggestedTitle("");
    setError(null);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError({
        message: "Vui lòng nhập chủ đề bài viết trước khi tiếp tục.",
      });
      return;
    }

    if (trimmedTopic.length > 150) {
      setError({
        message: "Chủ đề không được vượt quá 150 ký tự.",
      });
      return;
    }

    if (suggestedTitle.trim().length > 200) {
      setError({
        message: "Tiêu đề gợi ý không được vượt quá 200 ký tự.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/workflows/wf01/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: trimmedTopic,
          suggestedTitle: suggestedTitle.trim() || undefined,
        }),
      });

      const data: TriggerWF01Response = await res.json();

      if (!res.ok || !data.success) {
        let errorMsg =
          data.message ||
          "Không thể kích hoạt workflow WF01. Vui lòng thử lại sau.";

        if (res.status === 401) {
          errorMsg =
            "Phiên làm việc quản trị đã hết hạn. Vui lòng đăng nhập lại tại trang /login.";
        } else if (res.status === 403) {
          errorMsg =
            "Yêu cầu bị từ chối do không vượt qua kiểm tra chống CSRF hoặc thiếu quyền quản trị.";
        } else if (res.status === 404) {
          errorMsg =
            "Không tìm thấy Webhook WF01 trên n8n. Vui lòng kiểm tra workflow đã được bật (Active) chưa.";
        }

        setError({
          status: res.status,
          message: errorMsg,
        });
        return;
      }

      // Success
      setResult(data);
    } catch {
      setError({
        status: 0,
        message:
          "Lỗi mạng: Không thể kết nối đến máy chủ Next.js hoặc gateway nội bộ.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Sinh Nội Dung AI (n8n WF01)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
            Kích hoạt quy trình tự động hóa n8n & mô hình Ollama AI để sản xuất nội dung mạng xã hội chuẩn y khoa.
          </p>
        </div>

        <Link href="/posts">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 self-start">
            <FileText className="w-3.5 h-3.5" />
            <span>Quản lý bài viết</span>
          </Button>
        </Link>
      </div>

      {/* Architecture Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl border border-border/80 bg-muted/30 text-xs">
        <div className="flex items-start gap-2.5">
          <Bot className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">1. Ollama AI (qwen2.5:7b)</p>
            <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">
              Tạo bài đăng Facebook hấp dẫn với tiêu đề, thân bài và hashtag chuyên môn.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">2. Bộ Lọc Y Khoa Kép</p>
            <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">
              Tự động thẩm định tính chính xác, cảnh báo chống chỉ định và chuẩn ngôn từ.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Workflow className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">3. Lưu Trữ Bất Đồng Bộ</p>
            <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">
              n8n WF01 lưu bản nháp vào MongoDB với trạng thái CHỜ DUYỆT (PENDING_REVIEW).
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification Card */}
      {result && (
        <Card className="border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-base font-semibold text-emerald-800 dark:text-emerald-300">
                {result.message}
              </CardTitle>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ml-auto border border-emerald-500/30">
                Webhook 200 OK
              </span>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {result.details}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-card border border-border/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Chủ đề đã gửi:</span>
                <span className="font-semibold text-foreground text-right">{result.topic}</span>
              </div>
              {result.suggestedTitle && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tiêu đề gợi ý:</span>
                  <span className="font-medium text-foreground text-right">{result.suggestedTitle}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50 text-muted-foreground">
                <span>Trạng thái workflow:</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Đang xử lý trong n8n (bất đồng bộ)
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-500/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tạo thêm bài viết khác</span>
            </Button>
            <Link href="/posts">
              <Button
                size="sm"
                className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <span>Đến trang Quản lý bài viết để kiểm tra</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-xs text-destructive flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">Kích hoạt workflow không thành công</p>
            <p className="text-destructive/90 leading-relaxed">{error.message}</p>
            {error.status === 401 && (
              <div className="pt-1">
                <Link
                  href="/login?from=/generator"
                  className="font-semibold underline hover:no-underline"
                >
                  Bấm vào đây để đăng nhập lại
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generator Form */}
      <Card className="border-border shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Thông tin tạo bài viết
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Nhập chủ đề y tế hoặc chọn từ danh sách gợi ý. n8n WF01 sẽ chuyển thông tin đến node <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">Prepare Topic</code>.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Quick Topic Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Gợi ý chủ đề nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TOPICS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleApplyTopic(item)}
                    className="text-left text-xs px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors disabled:opacity-50"
                  >
                    {item.topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="generator-topic"
                  className="text-xs font-semibold text-foreground flex items-center gap-1"
                >
                  <span>Chủ đề bài viết</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    topic.length > 150 ? "text-rose-500 font-bold" : "text-muted-foreground"
                  }`}
                >
                  {topic.length}/150
                </span>
              </div>
              <input
                id="generator-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={150}
                disabled={isLoading}
                placeholder="Ví dụ: Chế độ ăn giảm acid uric cho người bị gout cấp..."
                className="w-full h-10 px-3.5 rounded-lg bg-background border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:opacity-60"
              />
              <p className="text-[11px] text-muted-foreground">
                Bắt buộc. Tối đa 150 ký tự. Được truyền trực tiếp vào node Prepare Topic trong n8n.
              </p>
            </div>

            {/* Suggested Title Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="generator-suggested-title"
                  className="text-xs font-semibold text-foreground flex items-center gap-1"
                >
                  <span>Tiêu đề gợi ý (Tùy chọn)</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    suggestedTitle.length > 200
                      ? "text-rose-500 font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {suggestedTitle.length}/200
                </span>
              </div>
              <input
                id="generator-suggested-title"
                type="text"
                value={suggestedTitle}
                onChange={(e) => setSuggestedTitle(e.target.value)}
                maxLength={200}
                disabled={isLoading}
                placeholder="Ví dụ: 7 Thực phẩm cần tránh để không bùng phát cơn đau gout..."
                className="w-full h-10 px-3.5 rounded-lg bg-background border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:opacity-60"
              />
              <p className="text-[11px] text-muted-foreground">
                Tùy chọn. Tối đa 200 ký tự. Định hướng tiêu đề cho mô hình Ollama AI.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/60">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 self-start sm:self-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Yêu cầu được bảo vệ bằng chữ ký HMAC & chống CSRF</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isLoading || (!topic && !suggestedTitle)}
                className="text-xs w-full sm:w-auto"
              >
                Đặt lại
              </Button>

              <Button
                type="submit"
                disabled={isLoading || !topic.trim()}
                className="text-xs font-medium w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 text-white shadow-sm gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gửi yêu cầu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tạo bài bằng AI</span>
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
