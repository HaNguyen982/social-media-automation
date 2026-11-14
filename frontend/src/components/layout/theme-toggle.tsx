"use client";

import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <Sun className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-9 h-9 rounded-lg hover:bg-accent transition-colors"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-all rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 dark:text-slate-200 transition-all rotate-0 scale-100" />
      )}
      <span className="sr-only">Chuyển giao diện</span>
    </Button>
  );
}
