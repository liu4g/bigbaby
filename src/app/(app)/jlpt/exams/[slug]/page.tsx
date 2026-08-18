import type { Metadata } from "next";
import { ArrowLeft, Clock3, Trophy } from "lucide-react";
import { JlptExamRunner } from "@/components/jlpt/jlpt-exam-runner";
import { JlptPaywall } from "@/components/jlpt/jlpt-paywall";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getUserProfile, isAuthPreviewEnabled, requireUser } from "@/lib/auth";
import { getJlptExamDetail, normalizePreviewPlan } from "@/lib/jlpt";
import { jlptExams } from "@/lib/jlpt-data";
import { levelTone } from "@/lib/site";

type Params = { slug: string };
type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const exam = jlptExams.find((item) => item.slug === decodeURIComponent(slug));

  return {
    title: exam?.accessTier === "pro" ? "高级 JLPT 模拟考试" : exam ? exam.title : "JLPT 模拟考试",
    description: exam?.accessTier === "pro" ? "PRO JLPT 原创模拟考试。" : exam ? exam.description : "JLPT 原创模拟考试。"
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
  const result = await getJlptExamDetail(supabase, user, decodeURIComponent(slug), previewPlan);
  const pagePlan = isAuthPreviewEnabled() ? result.accountTier : undefined;

  if (!result.exam) {
    return (
      <Section>
        <EmptyState
          title="没有找到这套模拟考试"
          description="这套考试可能尚未发布，或当前账户没有访问权限。"
          actionLabel="返回 JLPT"
          actionHref="/jlpt"
          icon={<Trophy className="h-5 w-5" />}
        />
      </Section>
    );
  }

  const exam = result.exam;

  return (
    <Section>
      <div className="space-y-8">
        <Button href={`/jlpt/${exam.level.toLowerCase()}${pagePlan ? `?plan=${pagePlan}` : ""}`} variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
          返回 {exam.level}
        </Button>

        <PageHeader
          eyebrow="JLPT Mock Exam"
          title={exam.title}
          description={exam.description}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={levelTone(exam.level)}>{exam.level}</Badge>
              <Badge variant={exam.accessTier === "pro" ? "warning" : "outline"}>{exam.accessTier.toUpperCase()}</Badge>
              <Badge variant="muted">目标 {profile.target_jlpt_level}</Badge>
            </div>
          }
        />

        {result.isLocked ? (
          <JlptPaywall level={exam.level} />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Info icon={<Clock3 className="h-4 w-4" />} label="考试时长" value={`${Math.round(exam.durationSeconds / 60)} 分钟`} />
              <Info icon={<Trophy className="h-4 w-4" />} label="总分" value={`${exam.totalScore} 分`} />
              <Info icon={<Trophy className="h-4 w-4" />} label="历史最高" value={`${Math.round(exam.bestScore)} 分`} />
            </div>
            <JlptExamRunner exam={exam} plan={pagePlan} />
          </>
        )}
      </div>
    </Section>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
