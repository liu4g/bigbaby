"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChartColumn,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Newspaper,
  PenTool,
  Sigma,
  Trophy,
  UserRound
} from "lucide-react";
import { appNav } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  "book-open": BookOpen,
  sigma: Sigma,
  newspaper: Newspaper,
  "pen-tool": PenTool,
  trophy: Trophy,
  "chart-column": ChartColumn,
  "user-round": UserRound
} as const;

export function AppShell({
  children,
  user,
  signOutAction
}: {
  children: React.ReactNode;
  user: {
    email: string;
    nickname: string;
    avatarUrl: string | null;
    targetLevel: string;
  };
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const initials = user.nickname.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="text-sm sm:text-base">JAPANWEB</span>
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/profile"
              className="hidden min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:flex"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-xs text-primary">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </span>
              <span className="min-w-0 truncate">{user.nickname}</span>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{user.targetLevel}</span>
            </Link>

            <ThemeToggle />

            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="icon" aria-label="退出登录">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-border/80">
          <div className="mx-auto w-full max-w-7xl px-2 py-2 sm:px-4 lg:px-8">
            <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {appNav.map((item) => {
                const Icon = iconMap[item.icon];
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
