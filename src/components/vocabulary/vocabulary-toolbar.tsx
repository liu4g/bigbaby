import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { levelFilters, type LevelFilter } from "@/lib/site";
import { getVocabularyLevelHref, type AccountTier } from "@/lib/vocabulary";
import { vocabularyCategories } from "@/lib/vocabulary-data";
import { cn } from "@/lib/utils";

export function VocabularyToolbar({
  activeLevel,
  query,
  category,
  plan,
  isPreview
}: {
  activeLevel: LevelFilter;
  query: string;
  category: string;
  plan?: AccountTier;
  isPreview: boolean;
}) {
  const basePath = getVocabularyLevelHref(activeLevel);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {levelFilters.map((level) => (
          <Link
            key={level}
            href={getVocabularyLevelHref(level, { query, category, plan })}
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

      <form action={basePath} className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
        {plan ? <input type="hidden" name="plan" value={plan} /> : null}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="vocabulary-search"
            name="q"
            type="search"
            defaultValue={query}
            aria-label="搜索单词、读音、中文释义或近义词"
            placeholder="搜索单词、读音、中文释义"
            className="pl-9"
          />
        </div>

        <Select name="category" defaultValue={category} aria-label="选择单词分类">
          <option value="all">全部分类</option>
          {vocabularyCategories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>

        <div className="flex gap-2">
          <Button type="submit" leadingIcon={<SlidersHorizontal className="h-4 w-4" />} className="flex-1 lg:flex-none">
            筛选
          </Button>
          {(query || category !== "all") && (
            <Button href={getVocabularyLevelHref(activeLevel, { plan })} variant="outline">
              重置
            </Button>
          )}
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        {vocabularyCategories.map((item) => (
          <Link
            key={item.id}
            href={getVocabularyLevelHref(activeLevel, { query, category: item.id, plan })}
            className={cn(
              "inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium transition-colors",
              category === item.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {isPreview ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">权限预览</span>
          <Link
            href={getVocabularyLevelHref(activeLevel, { query, category, plan: "free" })}
            className={cn(
              "rounded-md px-2 py-1 font-medium transition-colors",
              plan === "free" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
            )}
          >
            FREE 用户
          </Link>
          <Link
            href={getVocabularyLevelHref(activeLevel, { query, category, plan: "pro" })}
            className={cn(
              "rounded-md px-2 py-1 font-medium transition-colors",
              plan !== "free" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
            )}
          >
            PRO 用户
          </Link>
          <span>真实数据库环境下会由 subscriptions + RLS 判断，不使用这个参数。</span>
        </div>
      ) : null}
    </div>
  );
}
