import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function MarketingShell({ children }: { children: React.ReactNode }) {
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
            <Button href="/login" variant="ghost" size="sm">
              登录
            </Button>
            <Button href="/register" size="sm">
              注册
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
