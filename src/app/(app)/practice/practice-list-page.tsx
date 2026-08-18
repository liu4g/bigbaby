import type { Metadata } from "next";
import { CheckCircle2, CircleAlert, Layers3, PenTool, RotateCcw } from "lucide-react";
import { PracticeCard } from "@/components/practice/practice-card";
import { PracticePaywall } from "@/components/practice/practice-paywall";
import { PracticeToolbar } from "@/components/practice/practice-toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getUserProfile, requireUser } from "@/lib/auth";
import type { Level } from "@/lib/site";
import {
  getPracticeList,
  isProPracticeLevel,
  normalizePracticeKind,
  normalizePracticeLevel,
  normalizePracticeQuery,
  normalizePreviewPlan
} from "@/lib/practice";

export const practiceMetadata: Metadata = {
  title: "练习",
  description: "按 JLPT N5-N1 进行单词、语法、阅读、JLPT 和综合练习，支持单选、多选、填空和阅读理解。"
};

type SearchParams = Record<string, string | string[] | undefined>;

export async function PracticeListPage({
  fixedLevel,
  searchParams
}: {
  fixedLevel?: Level;
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const level = fixedLevel ?? normalizePracticeLevel(params.level);
  const kind = normalizePracticeKind(params.kind);
  const query = normalizePracticeQuery(params.q);
  const previewPlan = normalizePreviewPlan(params.plan);
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user);
  const result = await getPracticeList(supabase, user, {
    level,
    kind,
    query,
    previewPlan
  });
  const pagePlan = result.isPreview ? result.accountTier : undefined;
  const showProPaywall = result.accountTier === "free" && (isProPracticeLevel(result.activeLevel) || result.activeLevel === "all");

  return (
    <Section>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Practice"
          title={result.activeLevel === "all" ? "练习中心" : `${result.activeLevel} 练习`}
          description={`当前目标 ${profile.target_jlpt_level}。按等级和题型选择原创练习，提交后会生成正确率、解析、错题和复习建议。`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={result.accountTier === "pro" ? "accent" : "outline"}>{result.accountTier.toUpperCase()}</Badge>
              <Badge variant="muted">服务端判分</Badge>
            </div>
          }
        />

        <PracticeToolbar
          activeLevel={result.activeLevel}
          activeKind={result.activeKind}
          query={result.query}
          plan={pagePlan}
          isPreview={result.isPreview}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard icon={<PenTool className="h-4 w-4" />} label="练习套数" value={result.stats.total} />
          <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="可练习" value={result.stats.unlocked} tone="success" />
          <MetricCard icon={<Layers3 className="h-4 w-4" />} label="题目数量" value={result.stats.questions} />
          <MetricCard icon={<CircleAlert className="h-4 w-4" />} label="待复习错题" value={result.stats.wrong} tone="warning" />
          <MetricCard icon={<RotateCcw className="h-4 w-4" />} label="平均最好正确率" value={`${result.stats.bestAccuracy}%`} />
        </div>

        {showProPaywall ? <PracticePaywall level={isProPracticeLevel(result.activeLevel) ? result.activeLevel : "N2 / N1"} /> : null}

        {result.items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((item) => (
              <PracticeCard key={item.id} item={item} plan={pagePlan} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="没有找到匹配的练习"
            description="可以清空搜索词，或切换 JLPT 等级和练习类型重新查看。"
            actionLabel="查看全部练习"
            actionHref="/practice"
            icon={<PenTool className="h-5 w-5" />}
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
  value: number | string;
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
