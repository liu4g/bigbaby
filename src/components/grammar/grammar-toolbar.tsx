import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { levelFilters, type LevelFilter } from "@/lib/site";
import { getGrammarLevelHref } from "@/lib/grammar";
import type { AccountTier } from "@/lib/vocabulary";
import { cn } from "@/lib/utils";

export function GrammarToolbar({
  activeLevel,
  query,
  plan,
  isPreview
}: {
  activeLevel: LevelFilter;
  query: string;
  plan?: AccountTier;
  isPreview: boolean;
}) {
  const basePath = getGrammarLevelHref(activeLevel);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {levelFilters.map((level) => (
          <Link
            key={level}
            href={getGrammarLevelHref(level, { query, plan })}
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

      <form action={basePath} className="grid gap-3 lg:grid-cols-[1fr_auto]">
        {plan ? <input type="hidden" name="plan" value={plan} /> : null}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="grammar-search"
            name="q"
            type="search"
            defaultValue={query}
            aria-label="搜索语法点、接续、含义或说明"
            placeholder="搜索语法点、接续、含义"
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" leadingIcon={<SlidersHorizontal className="h-4 w-4" />} className="flex-1 lg:flex-none">
            筛选
          </Button>
          {query ? (
            <Button href={getGrammarLevelHref(activeLevel, { plan })} variant="outline">
              重置
            </Button>
          ) : null}
        </div>
      </form>

      {isPreview ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">权限预览</span>
          <Link
            href={getGrammarLevelHref(activeLevel, { query, plan: "free" })}
            className={cn(
              "rounded-md px-2 py-1 font-medium transition-colors",
              plan === "free" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
            )}
          >
            FREE 用户
          </Link>
          <Link
            href={getGrammarLevelHref(activeLevel, { query, plan: "pro" })}
            className={cn(
              "rounded-md px-2 py-1 font-medium transition-colors",
              plan !== "free" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
            )}
          >
            PRO 用户
          </Link>
          <span>真实数据库环境下由 subscriptions + RLS 判断。</span>
        </div>
      ) : null}
    </div>
  );
}
