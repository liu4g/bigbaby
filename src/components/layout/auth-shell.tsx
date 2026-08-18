import Link from "next/link";
import { BookOpenCheck, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";

const highlights = [
  "N5 到 N1 分级内容",
  "JLPT 风格原创练习",
  "学习进度与复习节奏",
  "FREE / PRO 权限体系"
];

export function AuthShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="text-sm sm:text-base">JAPANWEB</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button href="/" variant="ghost" size="sm">
              返回首页
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="py-8 sm:py-10 lg:py-14">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <aside className="flex flex-col justify-between gap-8 rounded-lg border border-border bg-card p-6 sm:p-8">
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                日本語学习平台
              </p>
              <h1 className="max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
                {title}
              </h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                账号安全
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4" />
                  登录状态会自动保持，退出后会清除当前会话。
                </div>
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4" />
                  学习记录、收藏和订阅信息只属于你的账号。
                </div>
              </div>
            </div>
          </aside>

          <div className="rounded-lg border border-border bg-card p-6 sm:p-8">{children}</div>
        </div>
      </section>
    </div>
  );
}
