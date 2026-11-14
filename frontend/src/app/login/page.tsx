"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/posts";

  const [secret, setSecret] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) {
      setErrorMessage("Vui lòng nhập khóa quản trị viên (ADMIN_SECRET).");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.message || "Khóa quản trị viên không chính xác. Vui lòng kiểm tra lại."
        );
        return;
      }

      // Success: redirect to destination page
      router.push(from);
      router.refresh();
    } catch {
      setErrorMessage(
        "Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Brand & Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/25 mb-1">
          <Bot className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          AutoSocial Studio
        </h1>
        <p className="text-xs text-muted-foreground">
          Cổng Xác Thực Quản Trị Hệ Thống (Môi trường DEMO)
        </p>
      </div>

      {/* Demo Notice Banner */}
      <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 dark:bg-blue-950/30 text-xs text-foreground space-y-1">
        <div className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
          <Info className="w-4 h-4 shrink-0" />
          <span>Cơ chế Xác thực Quản trị DEMO</span>
        </div>
        <p className="text-muted-foreground leading-relaxed pl-6">
          Sử dụng khóa bí mật <code className="px-1 py-0.5 rounded bg-muted font-mono font-medium text-foreground">ADMIN_SECRET</code> (tối thiểu 16 ký tự) đã cấu hình trong file <code className="px-1 py-0.5 rounded bg-muted font-mono font-medium text-foreground">.env.local</code> để mở quyền phê duyệt và sinh bài viết.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-500" />
            Đăng nhập Quản trị
          </h2>
          <p className="text-xs text-muted-foreground">
            Phiên làm việc được bảo vệ bằng cookie HttpOnly và chữ ký HMAC-SHA256.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-xs text-destructive flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-secret"
              className="text-xs font-medium text-foreground block"
            >
              Khóa Quản trị (ADMIN_SECRET)
            </label>
            <div className="relative">
              <input
                id="admin-secret"
                type={showPassword ? "text" : "password"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Nhập khóa ADMIN_SECRET..."
                disabled={isLoading}
                autoComplete="current-password"
                className="w-full h-10 pl-3.5 pr-10 rounded-lg bg-background border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Ẩn khóa" : "Hiện khóa"}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Khóa được gửi trực tiếp lên Route Handler để kiểm tra timing-safe.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 text-white font-medium text-sm shadow-md shadow-indigo-500/20"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xác thực...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Đăng nhập Quản trị viên
              </span>
            )}
          </Button>
        </form>
      </div>

      {/* Back to Public Dashboard */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Bảng điều khiển (Chế độ xem công khai)</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
