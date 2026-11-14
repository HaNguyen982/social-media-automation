import Link from "next/link";
import {
  Sparkles,
  FileCheck,
  Calendar,
  Share2,
  Workflow,
  Sliders,
} from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      title: "Sinh bài viết AI",
      desc: "Prompt Ollama tạo bài mới",
      icon: Sparkles,
      href: "/generator",
      gradient: "from-blue-600/10 to-indigo-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      title: "Hàng đợi duyệt",
      desc: "Kiểm định bài chờ duyệt",
      icon: FileCheck,
      href: "/posts?status=PENDING_REVIEW",
      gradient: "from-amber-600/10 to-orange-600/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    {
      title: "Lên lịch bài đăng",
      desc: "Khung giờ vàng Fanpage",
      icon: Calendar,
      href: "/calendar",
      gradient: "from-emerald-600/10 to-teal-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Điều phối n8n",
      desc: "Kích hoạt & giám sát luồng",
      icon: Workflow,
      href: "/workflows",
      gradient: "from-purple-600/10 to-violet-600/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((act, i) => {
        const Icon = act.icon;
        return (
          <Link
            key={i}
            href={act.href}
            className={`p-3.5 rounded-xl border bg-card hover:bg-muted/40 transition-all shadow-xs group flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`p-2 rounded-lg border ${act.gradient}`}>
                <Icon className="w-4 h-4" />
              </span>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                {act.title}
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {act.desc}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
