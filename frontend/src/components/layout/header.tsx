"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/use-auth";
import {
  Bell,
  Search,
  Menu,
  Server,
  Sparkles,
  LogOut,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();

  useEffect(() => {
    let mounted = true;
    apiClient
      .checkHealth()
      .then((res) => {
        if (mounted) setApiOnline(res?.success === true);
      })
      .catch(() => {
        if (mounted) setApiOnline(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 text-muted-foreground"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Mở menu</span>
        </Button>

        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết, chủ đề, nhật ký... (⌘K)"
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted/60 border border-input text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background transition-all"
          />
        </div>
      </div>

      {/* Right: API Status, Quick Actions, Auth Status, Theme, Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* API Backend Health Indicator */}
        <div
          className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border border-border bg-muted/40 font-medium"
          title={
            apiOnline === true
              ? "Kết nối thành công với NestJS API (localhost:3000)"
              : "Đang sử dụng dữ liệu mẫu hoặc API đang ngoại tuyến"
          }
        >
          <Server className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="hidden md:inline text-muted-foreground">API:</span>
          {apiOnline === null ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              Kiểm tra...
            </span>
          ) : apiOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Trực tuyến
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Dữ liệu mẫu
            </span>
          )}
        </div>

        {/* Quick Generate Action */}
        <Button
          size="sm"
          className="hidden md:inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
          onClick={() => {
            window.location.href = "/generator";
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sinh bài mới</span>
        </Button>

        {/* Auth State & Logout / Login Button */}
        {!authLoading && (
          <>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="h-8 px-2.5 text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
                  title="Đăng xuất khỏi phiên quản trị viên"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs border-indigo-200 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng nhập Admin</span>
                </Button>
              </Link>
            )}
          </>
        )}

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
          title="Thông báo"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-card" />
          <span className="sr-only">Thông báo</span>
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
