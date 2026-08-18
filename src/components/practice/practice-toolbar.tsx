import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPracticeLevelHref,
  practiceKindFilters,
  type PracticeKindFilter
} from "@/lib/practice";
import { practiceKindLabels } from "@/lib/practice-data";
import { levelFilters, type LevelFilter } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { AccountTier } from "@/lib/vocabulary";

export function PracticeToolbar({
  activeLevel,
  activeKind,
  query,
  plan,
  isPreview
}: {
  activeLevel: LevelFilter;
  activeKind: PracticeKindFilter;
  query: string;
  plan?: AccountTier;
  isPreview: boolean;
}) {
  const basePath = getPracticeLevelHref(activeLevel);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {levelFilters.map((level) => (
          <Link
            key={level}
            href={getPracticeLevelHref(level, { query, kind: activeKind, plan })}
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
              activeLevel === level
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            {level === "all" ? "全部" : level}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {practiceKindFilters.map((kind) => (
          <Link
            key={kind}
            href={getPracticeLevelHref(activeLevel, { query, kind, plan })}
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
              activeKind === kind
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            {practiceKindLabels[kind]}
          </Link>
        ))}
      </div>

      <form action={basePath} className="grid gap-3 lg:grid-cols-[1fr_auto]">
        {activeKind !== "all" ? <input type="hidden" name="kind" value={activeKind} /> : null}
        {plan ? <input type="hidden" name="plan" value={plan} /> : null}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="practice-search"
            name="q"
            type="search"
            defaultValue={query}
            aria-label="搜索练习标题、说明或题干"
            placeholder="搜索练习标题、说明或题干"
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" leadingIcon={<SlidersHorizontal className="h-4 w-4" />} className="flex-1 lg:flex-none">
            筛选
          </Button>
          {query || activeKind !== "all" ? (
            <Button href={getPracticeLevelHref(activeLevel, { plan })} variant="outline">
              重置
            </Button>
          ) : null}
        </div>
      </form>

      {isPreview ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">权限预览</span>
          <Link
            href={getPracticeLevelHref(activeLevel, { query, kind: activeKind, plan: "free" })}
            className={cn(
              "rounded-md px-2 py-1 font-medium transition-colors",
              plan === "free" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
            )}
          >
            FREE 用户
          </Link>
          <Link
            href={getPracticeLevelHref(activeLevel, { query, kind: activeKind, plan: "pro" })}
            className={cn(
              "rounded-md px-2 py-1 font-medium transition-colors",
              plan !== "free" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
            )}
          >
            PRO 用户
          </Link>
          <span>真实环境下由 subscriptions、服务端 RPC 和 Supabase RLS 共同判断。</span>
        </div>
      ) : null}
    </div>
  );
}
