import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpenCheck, Download, Trophy } from "lucide-react";
import { JlptExamCard } from "@/components/jlpt/jlpt-exam-card";
import { JlptPaywall } from "@/components/jlpt/jlpt-paywall";
import { JlptResourceCard } from "@/components/jlpt/jlpt-resource-card";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getUserProfile, isAuthPreviewEnabled, requireUser } from "@/lib/auth";
import { getJlptLevelDetail, normalizePreviewPlan } from "@/lib/jlpt";
import { jlptSectionZhLabels } from "@/lib/jlpt-data";
import { isLevel, levelTone, type Level } from "@/lib/site";

type Params = { level: string };
type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { level } = await params;
  const normalized = level.toUpperCase();

  return {
    title: isLevel(normalized) ? `JLPT ${normalized}` : "JLPT",
    description: isLevel(normalized) ? `JLPT ${normalized} 原创模拟考试和专项训练。` : "JLPT 原创模拟考试和专项训练。"
  };
}

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<Params>;
  searchParams?: Promise<SearchParams>;
}) {
  const [{ level }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const normalized = level.toUpperCase();

  if (!isLevel(normalized)) {
    notFound();
  }

  const currentLevel = normalized as Level;
  const previewPlan = normalizePreviewPlan(resolvedSearchParams?.plan);
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user);
  const result = await getJlptLevelDetail(supabase, user, currentLevel, previewPlan);
  const pagePlan = isAuthPreviewEnabled() ? result.accountTier : undefined;
  const isLockedLevel = result.accountTier === "free" && (currentLevel === "N2" || currentLevel === "N1");

  if (!result.track) {
    notFound();
  }

  return (
    <Section>
      <div className="space-y-8">
        <Button href={`/jlpt${pagePlan ? `?plan=${pagePlan}` : ""}`} variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
          返回 JLPT
        </Button>

        <PageHeader
          eyebrow="JLPT"
          title={result.track.title}
          description={`当前目标 ${profile.target_jlpt_level}。${result.track.description}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={levelTone(currentLevel)}>{currentLevel}</Badge>
              <Badge variant={result.accountTier === "pro" ? "accent" : "outline"}>{result.accountTier.toUpperCase()}</Badge>
            </div>
          }
        />

        {isLockedLevel ? <JlptPaywall level={currentLevel} /> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {result.track.modules.map((module) => (
            <Card key={module.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {module.kind === "mock_exam" ? <Trophy className="h-4 w-4 text-primary" /> : <BookOpenCheck className="h-4 w-4 text-primary" />}
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {module.kind === "mock_exam" ? module.description : `${jlptSectionZhLabels[module.kind]}：${module.description}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Mock Exam</h2>
          {result.exams.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {result.exams.map((exam) => (
                <JlptExamCard key={exam.id} exam={exam} plan={pagePlan} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="暂无这个等级的模拟考试"
              description="后续可以在管理端添加新的原创模拟考试。"
              actionLabel="返回 JLPT"
              actionHref="/jlpt"
              icon={<Trophy className="h-5 w-5" />}
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">授权资料入口</h2>
            <Button href={`/jlpt/resources${pagePlan ? `?plan=${pagePlan}` : ""}`} variant="outline" leadingIcon={<Download className="h-4 w-4" />}>
              查看全部
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {result.resources.map((resource) => (
              <JlptResourceCard
                key={resource.id}
                resource={{
                  ...resource,
                  canAccess: result.accountTier === "pro" || (resource.accessTier === "free" && !["N2", "N1"].includes(resource.level))
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
