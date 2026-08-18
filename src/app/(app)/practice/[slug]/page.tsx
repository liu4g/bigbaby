import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, Clock3, Layers3, PenTool, RotateCcw } from "lucide-react";
import { PracticePaywall } from "@/components/practice/practice-paywall";
import { PracticeRunner } from "@/components/practice/practice-runner";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getUserProfile, requireUser } from "@/lib/auth";
import { levelTone } from "@/lib/site";
import { getPracticeDetail, normalizePreviewPlan } from "@/lib/practice";
import { practiceKindLabels, practiceSets, questionTypeLabels } from "@/lib/practice-data";

type Params = { slug: string };
type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = practiceSets.find((item) => item.slug === decodeURIComponent(slug));

  return {
    title: entry?.accessTier === "pro" ? "高级练习 - 练习" : entry ? `${entry.title} - 练习` : "练习详情",
    description: entry?.accessTier === "pro" ? "查看 PRO 高级原创日语练习。" : entry ? entry.description : "查看原创日语练习题并提交答案。"
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
  const result = await getPracticeDetail(supabase, user, decodeURIComponent(slug), previewPlan);
  const pagePlan = result.isPreview ? result.accountTier : undefined;

  if (!result.set && result.isLocked) {
    return (
      <Section>
        <div className="space-y-6">
          <Button href="/practice" variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
            返回练习中心
          </Button>
          <PageHeader
            eyebrow="Practice"
            title="高级练习"
            description="当前账户没有访问这套练习的权限。"
            actions={<Badge variant="outline">{result.accountTier.toUpperCase()}</Badge>}
          />
          <PracticePaywall />
        </div>
      </Section>
    );
  }

  if (!result.set) {
    return (
      <Section>
        <EmptyState
          title="没有找到这套练习"
          description="这套练习可能尚未发布，或当前账户没有访问权限。"
          actionLabel="返回练习中心"
          actionHref="/practice"
          icon={<PenTool className="h-5 w-5" />}
        />
      </Section>
    );
  }

  const practiceSet = result.set;
  const returnHref = `/practice/${practiceSet.jlptLevel.toLowerCase()}${pagePlan ? `?plan=${pagePlan}` : ""}`;

  return (
    <Section>
      <div className="space-y-8">
        <Button href={returnHref} variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
          返回 {practiceSet.jlptLevel}
        </Button>

        <PageHeader
          eyebrow="Practice"
          title={practiceSet.title}
          description={practiceSet.isLocked ? "此练习属于 PRO 高级内容，FREE 账户不能查看完整题目。" : practiceSet.description}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={levelTone(practiceSet.jlptLevel)}>{practiceSet.jlptLevel}</Badge>
              <Badge variant={practiceSet.accessTier === "pro" ? "warning" : "outline"}>{practiceSet.accessTier.toUpperCase()}</Badge>
              <Badge variant="muted">目标 {profile.target_jlpt_level}</Badge>
            </div>
          }
        />

        {practiceSet.isLocked ? (
          <PracticePaywall level={practiceSet.jlptLevel} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <PracticeRunner practiceSet={practiceSet} plan={pagePlan} />

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">练习信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoCell icon={<Layers3 className="h-4 w-4" />} label="类型" value={practiceKindLabels[practiceSet.kind]} />
                  <InfoCell icon={<PenTool className="h-4 w-4" />} label="题目" value={`${practiceSet.questions.length} 题`} />
                  <InfoCell icon={<Clock3 className="h-4 w-4" />} label="预计时间" value={`${practiceSet.estimatedMinutes} 分钟`} />
                  <InfoCell icon={<RotateCcw className="h-4 w-4" />} label="错题" value={`${practiceSet.wrongCount} 题`} />
                  <InfoCell icon={<CheckCircle2 className="h-4 w-4" />} label="历史最好" value={`${Math.round(practiceSet.bestAccuracy)}%`} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">题型</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {Array.from(new Set(practiceSet.questions.map((question) => question.questionType))).map((type) => (
                    <Badge key={type} variant="outline">
                      {questionTypeLabels[type]}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
                  提交后由服务端判分，错误题目会自动进入 Wrong Answers。真实 Supabase 环境中，N2/N1 练习提交前会再次校验订阅权限。
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
