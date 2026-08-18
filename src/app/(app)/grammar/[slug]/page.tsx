import type { Metadata } from "next";
import { ArrowLeft, BookOpenCheck, CheckCircle2, Clock3, Sigma, Tag } from "lucide-react";
import { GrammarActionButtons } from "@/components/grammar/grammar-action-buttons";
import { GrammarPaywall } from "@/components/grammar/grammar-paywall";
import { GrammarPractice } from "@/components/grammar/grammar-practice";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { getUserProfile, requireUser } from "@/lib/auth";
import { levelTone } from "@/lib/site";
import { getGrammarDetail, normalizePreviewPlan } from "@/lib/grammar";
import { grammarEntries, grammarStatusLabels } from "@/lib/grammar-data";

type Params = { slug: string };
type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = grammarEntries.find((item) => item.slug === decodeURIComponent(slug));

  return {
    title: entry ? `${entry.grammarPoint} - 语法` : "语法详情",
    description: entry ? `${entry.grammarPoint}：接续、例句、相关语法和练习。` : "查看日语语法接续、解释、例句、相关语法和练习。"
  };
}

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<Params>;
  searchParams?: Promise<SearchParams>;
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const previewPlan = normalizePreviewPlan(resolvedSearchParams?.plan);
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user);
  const result = await getGrammarDetail(supabase, user, decodeURIComponent(slug), previewPlan);
  const pagePlan = result.isPreview ? result.accountTier : undefined;

  if (!result.item && result.isLocked) {
    return (
      <Section>
        <div className="space-y-6">
          <Button href="/grammar" variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
            返回语法库
          </Button>
          <PageHeader
            eyebrow="Grammar"
            title="高级语法"
            description="当前账户没有访问这个语法点的权限。"
            actions={<Badge variant="outline">{result.accountTier.toUpperCase()}</Badge>}
          />
          <GrammarPaywall />
        </div>
      </Section>
    );
  }

  if (!result.item) {
    return (
      <Section>
        <EmptyState
          title="没有找到这个语法点"
          description="这个语法可能尚未发布，或当前账户没有访问权限。"
          actionLabel="返回语法库"
          actionHref="/grammar"
          icon={<Sigma className="h-5 w-5" />}
        />
      </Section>
    );
  }

  const item = result.item;
  const returnTo = pagePlan ? `/grammar/${item.slug}?plan=${pagePlan}` : `/grammar/${item.slug}`;

  return (
    <Section>
      <div className="space-y-8">
        <Button href={`/grammar/${item.jlptLevel.toLowerCase()}${pagePlan ? `?plan=${pagePlan}` : ""}`} variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
          返回 {item.jlptLevel}
        </Button>

        <PageHeader
          eyebrow="Grammar"
          title={item.grammarPoint}
          description={item.isLocked ? "此语法属于 PRO 高级内容，FREE 账户不能查看完整解释。" : item.formation}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={levelTone(item.jlptLevel)}>{item.jlptLevel}</Badge>
              <Badge variant={item.accessTier === "pro" ? "warning" : "outline"}>{item.accessTier.toUpperCase()}</Badge>
              <Badge variant="muted">目标 {profile.target_jlpt_level}</Badge>
            </div>
          }
        />

        {item.isLocked ? (
          <GrammarPaywall level={item.jlptLevel} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">接续与说明</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoCell label="语法点" value={item.grammarPoint} />
                    <InfoCell label="等级" value={item.jlptLevel} />
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Formation</p>
                    <p className="mt-2 text-base font-semibold">{item.formation}</p>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Meaning</p>
                    <p className="mt-2 text-lg font-semibold">{item.meaning}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.explanation}</p>
                  </div>

                  <RelatedGrammar items={item.similarGrammar} />

                  {item.notes ? (
                    <div className="rounded-lg border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
                      {item.notes}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">例句</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.examples.map((example) => (
                    <div key={example.japanese} className="rounded-lg border border-border bg-background p-4">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {example.note ? <Badge variant="warning">{example.note}</Badge> : null}
                        <Badge variant="muted">Example</Badge>
                      </div>
                      <p className="text-base font-medium">{example.japanese}</p>
                      {example.reading ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{example.reading}</p> : null}
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{example.meaning}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    学习状态
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <InfoCell label="状态" value={grammarStatusLabels[item.status]} />
                    <InfoCell label="下次复习" value={item.nextReviewAt ? new Date(item.nextReviewAt).toLocaleDateString("zh-CN") : "未加入"} />
                  </div>
                  <Progress value={item.masteryScore} label="掌握度" />
                  <GrammarActionButtons item={item} returnTo={returnTo} plan={pagePlan} />
                </CardContent>
              </Card>

              <GrammarPractice
                grammarPoint={item.grammarPoint}
                formation={item.formation}
                correctMeaning={item.meaning}
                choices={result.practiceChoices}
              />

              <Card>
                <CardContent className="flex gap-3 p-4 text-sm leading-6 text-muted-foreground">
                  <Clock3 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <p>收藏、已掌握、不熟悉和加入复习都会写入当前用户自己的学习数据。真实 Supabase 环境下，RLS 会阻止写入其他用户或未解锁内容。</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function RelatedGrammar({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Tag className="h-4 w-4 text-primary" />
        相关语法
      </div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">暂无相关语法</p>
      )}
    </div>
  );
}
