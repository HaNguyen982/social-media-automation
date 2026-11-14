"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Calendar,
  Share2,
  Workflow,
  ScrollText,
  Settings,
  ShieldCheck,
  Bot,
  LogOut,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "warning" | "default" | "success";
}

const navItems: NavItem[] = [
  {
    title: "Bảng điều khiển",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Sinh nội dung AI",
    href: "/generator",
    icon: Sparkles,
  },
  {
    title: "Quản lý bài viết",
    href: "/posts",
    icon: FileText,
    badge: "Live API",
    badgeVariant: "default",
  },
  {
    title: "Lịch nội dung",
    href: "/calendar",
    icon: Calendar,
  },
  {
    title: "Tài khoản MXH",
    href: "/accounts",
    icon: Share2,
  },
  {
    title: "Quy trình n8n",
    href: "/workflows",
    icon: Workflow,
    badge: "3 đang chạy",
    badgeVariant: "success",
  },
  {
    title: "Nhật ký hoạt động",
    href: "/logs",
    icon: ScrollText,
  },
  {
    title: "Cài đặt hệ thống",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r border-border select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
          <Bot className="w-5 h-5" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold text-sm tracking-tight text-foreground truncate">
            AutoSocial Studio
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            n8n + Ollama AI
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Quản trị & Tự động hóa
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : item.badgeVariant === "warning"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Medical Safety & Compliance Footer Banner */}
      <div className="p-3 mx-3 mb-3 rounded-lg border border-border/80 bg-muted/40">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">Bộ Lọc Y Khoa Kép</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Mọi nội dung AI sinh đều qua kiểm định tiêu chuẩn y tế & bác sĩ ký duyệt.
            </p>
          </div>
        </div>
      </div>

      {/* User / Session Profile Footer */}
      <div className="p-3 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0",
              isAuthenticated
                ? "bg-gradient-to-tr from-emerald-500 to-teal-400"
                : "bg-slate-400"
            )}
          >
            {isAuthenticated ? "AD" : "KV"}
          </div>
          <div className="flex flex-col text-xs overflow-hidden">
            <span className="font-semibold text-foreground truncate">
              {isAuthenticated ? (user?.name || "BS. Minh Quân") : "Khách xem"}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {isAuthenticated ? "Quản trị viên" : "Chế độ xem"}
            </span>
          </div>
        </div>

        {isAuthenticated ? (
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
            title="Đăng xuất quản trị"
          >
            <LogOut className="w-4 h-4" />
            <span className="sr-only">Đăng xuất</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors shrink-0"
            title="Đăng nhập quản trị viên"
          >
            <LogIn className="w-4 h-4" />
            <span className="sr-only">Đăng nhập</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
