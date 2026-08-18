import type { Metadata } from "next";
import { BookmarkCheck, CheckCircle2, CircleAlert, Layers3, RotateCcw, Sigma } from "lucide-react";
import { GrammarCard } from "@/components/grammar/grammar-card";
import { GrammarPaywall } from "@/components/grammar/grammar-paywall";
import { GrammarToolbar } from "@/components/grammar/grammar-toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getUserProfile, requireUser } from "@/lib/auth";
import type { Level } from "@/lib/site";
import {
  getGrammarLevelHref,
  getGrammarList,
  isProGrammarLevel,
  normalizeGrammarLevel,
  normalizeGrammarQuery,
  normalizePreviewPlan
} from "@/lib/grammar";

export const grammarMetadata: Metadata = {
  title: "语法",
  description: "按 JLPT N5-N1 学习日语语法，支持搜索、收藏、学习状态、例句、相关语法和练习。"
};

type SearchParams = Record<string, string | string[] | undefined>;

export async function GrammarListPage({
  fixedLevel,
  searchParams
}: {
  fixedLevel?: Level;
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const level = fixedLevel ?? normalizeGrammarLevel(params.level);
  const query = normalizeGrammarQuery(params.q);
  const previewPlan = normalizePreviewPlan(params.plan);
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user);
  const result = await getGrammarList(supabase, user, {
    level,
    query,
    previewPlan
  });
  const pagePlan = result.isPreview ? result.accountTier : undefined;
  const returnTo = getGrammarLevelHref(result.activeLevel, { query, plan: pagePlan });
  const showProPaywall = result.accountTier === "free" && (isProGrammarLevel(result.activeLevel) || result.activeLevel === "all");

  return (
    <Section>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Grammar"
          title={result.activeLevel === "all" ? "语法库" : `${result.activeLevel} 语法`}
          description={`当前目标 ${profile.target_jlpt_level}。按等级搜索语法点，查看接续、例句、相关语法，并把不熟悉的内容加入复习。`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={result.accountTier === "pro" ? "accent" : "outline"}>
                {result.accountTier.toUpperCase()}
              </Badge>
              <Badge variant="muted">服务器权限校验</Badge>
            </div>
          }
        />

        <GrammarToolbar activeLevel={result.activeLevel} query={result.query} plan={pagePlan} isPreview={result.isPreview} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard icon={<Sigma className="h-4 w-4" />} label="当前结果" value={result.stats.total} />
          <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="已掌握" value={result.stats.mastered} tone="success" />
          <MetricCard icon={<CircleAlert className="h-4 w-4" />} label="不熟悉" value={result.stats.unfamiliar} tone="warning" />
          <MetricCard icon={<RotateCcw className="h-4 w-4" />} label="复习中" value={result.stats.review} />
          <MetricCard icon={<BookmarkCheck className="h-4 w-4" />} label="已收藏" value={result.stats.bookmarked} />
        </div>

        {showProPaywall ? <GrammarPaywall level={isProGrammarLevel(result.activeLevel) ? result.activeLevel : "N2 / N1"} /> : null}

        {result.items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((item) => (
              <GrammarCard key={item.id} item={item} returnTo={returnTo} plan={pagePlan} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="没有找到匹配的语法"
            description="可以清空搜索词，或切换 JLPT 等级重新查看。"
            actionLabel="查看全部语法"
            actionHref={getGrammarLevelHref("all", { plan: pagePlan })}
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
