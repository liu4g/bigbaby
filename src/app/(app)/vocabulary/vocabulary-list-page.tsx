import type { Metadata } from "next";
import { BookOpenCheck, BookmarkCheck, CheckCircle2, CircleAlert, Layers3, RotateCcw } from "lucide-react";
import { VocabularyCard } from "@/components/vocabulary/vocabulary-card";
import { VocabularyPaywall } from "@/components/vocabulary/vocabulary-paywall";
import { VocabularyToolbar } from "@/components/vocabulary/vocabulary-toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getUserProfile, requireUser } from "@/lib/auth";
import type { Level } from "@/lib/site";
import {
  getVocabularyLevelHref,
  getVocabularyList,
  isProLevel,
  normalizePreviewPlan,
  normalizeVocabularyCategory,
  normalizeVocabularyLevel,
  normalizeVocabularyQuery
} from "@/lib/vocabulary";
import { vocabularyCategories } from "@/lib/vocabulary-data";

export const vocabularyMetadata: Metadata = {
  title: "单词",
  description: "按 JLPT N5-N1 学习日语单词，支持搜索、分类、收藏、复习状态和单词测试。"
};

type SearchParams = Record<string, string | string[] | undefined>;

export async function VocabularyListPage({
  fixedLevel,
  searchParams
}: {
  fixedLevel?: Level;
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const level = fixedLevel ?? normalizeVocabularyLevel(params.level);
  const query = normalizeVocabularyQuery(params.q);
  const category = normalizeVocabularyCategory(params.category);
  const previewPlan = normalizePreviewPlan(params.plan);
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user);
  const result = await getVocabularyList(supabase, user, {
    level,
    query,
    category,
    previewPlan
  });
  const pagePlan = result.isPreview ? result.accountTier : undefined;
  const returnTo = getVocabularyLevelHref(result.activeLevel, { query, category, plan: pagePlan });
  const showProPaywall = result.accountTier === "free" && (isProLevel(result.activeLevel) || result.activeLevel === "all");

  return (
    <Section>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Vocabulary"
          title={result.activeLevel === "all" ? "单词库" : `${result.activeLevel} 单词`}
          description={`当前目标 ${profile.target_jlpt_level}。按等级、分类和关键词学习词汇，并把不熟悉的词加入复习。`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={result.accountTier === "pro" ? "accent" : "outline"}>
                {result.accountTier.toUpperCase()}
              </Badge>
              <Badge variant="muted">服务器权限校验</Badge>
            </div>
          }
        />

        <VocabularyToolbar
          activeLevel={result.activeLevel}
          query={result.query}
          category={result.category}
          plan={pagePlan}
          isPreview={result.isPreview}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard icon={<BookOpenCheck className="h-4 w-4" />} label="当前结果" value={result.stats.total} />
          <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="已掌握" value={result.stats.mastered} tone="success" />
          <MetricCard icon={<CircleAlert className="h-4 w-4" />} label="不熟悉" value={result.stats.unfamiliar} tone="warning" />
          <MetricCard icon={<RotateCcw className="h-4 w-4" />} label="复习中" value={result.stats.review} />
          <MetricCard icon={<BookmarkCheck className="h-4 w-4" />} label="已收藏" value={result.stats.bookmarked} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {vocabularyCategories.map((item) => {
            const count = result.items.filter((entry) => entry.category === item.id).length;

            return (
              <a
                key={item.id}
                href={getVocabularyLevelHref(result.activeLevel, { query, category: item.id, plan: pagePlan })}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/60"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge variant={result.category === item.id ? "default" : "outline"}>{item.label}</Badge>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{item.description}</p>
              </a>
            );
          })}
        </div>

        {showProPaywall ? <VocabularyPaywall level={isProLevel(result.activeLevel) ? result.activeLevel : "N2 / N1"} /> : null}

        {result.items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((item) => (
              <VocabularyCard key={item.id} item={item} returnTo={returnTo} plan={pagePlan} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="没有找到匹配的单词"
            description="可以清空搜索词，或切换 JLPT 等级和分类重新查看。"
            actionLabel="查看全部单词"
            actionHref={getVocabularyLevelHref("all", { plan: pagePlan })}
            icon={<Layers3 className="h-5 w-5" />}
          />
        )}
      </div>
    </Section>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone = "default"
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
        ? "bg-warning/15 text-warning"
        : "bg-primary/10 text-primary";

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
