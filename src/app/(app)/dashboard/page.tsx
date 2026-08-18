import type { Metadata } from "next";
import { ArrowRight, BookOpenCheck, Brain, CalendarDays, CheckCircle2, Clock3, Flame, History, Target, Trophy } from "lucide-react";
import { DailyStudyPlan } from "@/components/learning/daily-study-plan";
import { WeeklyStudyChart } from "@/components/learning/weekly-study-chart";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { SubscriptionPaywall } from "@/components/subscription/subscription-paywall";
import { getAccountTier, normalizePreviewPlan } from "@/lib/access-control";
import { getUserProfile, requireUser } from "@/lib/auth";
import { getLearningOverview, type LearningSessionItem } from "@/lib/learning";

export const metadata: Metadata = {
  title: "学习首页",
  description: "查看今日学习计划、学习进度、连续学习天数、正确率和最近学习记录。"
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const previewPlan = normalizePreviewPlan(params.plan);
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user);
  const accountTier = await getAccountTier(supabase, user, previewPlan);
  const overview = await getLearningOverview(supabase, user, profile, accountTier);
  const { metrics } = overview;
  const goalPercent = Math.round((metrics.todayMinutes / metrics.dailyTargetMinutes) * 100);
  const isLocked = overview.isLocked;

  return (
    <Section>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Dashboard"
          title={`你好，${profile.nickname}`}
          description={`当前水平 ${profile.jlpt_level}，目标 ${profile.target_jlpt_level}。今天建议完成 ${metrics.dailyTargetItems} 项学习量，目标 ${metrics.dailyTargetMinutes} 分钟。`}
          actions={
            <>
              <Button href="/practice" variant="outline" leadingIcon={<Clock3 className="h-4 w-4" />}>
                10 分钟练习
              </Button>
              <Button href="/vocabulary" trailingIcon={<ArrowRight className="h-4 w-4" />}>
                快速开始
              </Button>
            </>
          }
        />

        {isLocked ? (
          <div className="space-y-4">
            <SubscriptionPaywall
              title="学习记录与学习计划属于 PRO"
              description="FREE 用户可以继续使用 N5-N3 单词、语法、文章和基础练习。升级后会解锁今日学习、本周趋势、连续学习、错题本和每日计划。"
              features={[
                "学习记录与本周趋势",
                "连续学习天数",
                "Daily Study Plan",
                "错题本与学习计划"
              ]}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">继续学习</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Button href="/vocabulary" variant="outline">单词</Button>
                <Button href="/grammar" variant="outline">语法</Button>
                <Button href="/reading" variant="outline">文章</Button>
                <Button href="/practice" variant="outline">练习</Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="今日学习" value={`${metrics.todayMinutes}/${metrics.dailyTargetMinutes}m`} hint={`已完成 ${Math.min(goalPercent, 100)}%`} icon={<Clock3 className="h-4 w-4" />} />
              <StatCard label="本周学习" value={formatMinutes(metrics.weeklyMinutes)} hint="最近 7 天累计" icon={<CalendarDays className="h-4 w-4" />} tone="accent" />
              <StatCard label="连续学习" value={`${metrics.streakDays} 天`} hint="按学习记录自动计算" icon={<Flame className="h-4 w-4" />} tone="warning" />
              <StatCard label="学习时间" value={formatMinutes(metrics.totalStudyMinutes)} hint="近 60 天记录" icon={<History className="h-4 w-4" />} />
              <StatCard label="正确率" value={`${metrics.averageAccuracy}%`} hint="基于练习与任务记录" icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
              <StatCard label="掌握单词" value={`${metrics.masteredVocabulary}`} hint={`平均掌握度 ${metrics.vocabularyMastery}%`} icon={<BookOpenCheck className="h-4 w-4" />} />
              <StatCard label="掌握语法" value={`${metrics.masteredGrammar}`} hint={`平均掌握度 ${metrics.grammarMastery}%`} icon={<Brain className="h-4 w-4" />} tone="accent" />
              <StatCard label="学习目标" value={profile.target_jlpt_level} hint={`每日 ${metrics.dailyTargetMinutes} 分钟`} icon={<Target className="h-4 w-4" />} tone="success" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
              <DailyStudyPlan tasks={overview.tasks} returnTo="/dashboard" plan={accountTier} />

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">JLPT 目标</CardTitle>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">围绕目标等级安排每日路径，先积累输入，再用原创练习检测。</p>
                    </div>
                    <Badge variant="outline">{profile.target_jlpt_level}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">今日学习目标</p>
                        <p className="mt-1 text-3xl font-semibold tracking-tight">{metrics.dailyTargetMinutes}m</p>
                      </div>
                      <Trophy className="h-8 w-8 text-primary" />
                    </div>
                    <Progress value={goalPercent} label="目标时间完成度" />
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                      <span className="text-muted-foreground">当前水平</span>
                      <span className="font-medium">{profile.jlpt_level}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                      <span className="text-muted-foreground">目标等级</span>
                      <span className="font-medium">{profile.target_jlpt_level}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                      <span className="text-muted-foreground">时区</span>
                      <span className="font-medium">{profile.timezone}</span>
                    </div>
                  </div>

                  <Button href={`/jlpt/${profile.target_jlpt_level.toLowerCase()}`} variant="outline" className="w-full" trailingIcon={<ArrowRight className="h-4 w-4" />}>
                    查看 JLPT 路径
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <WeeklyStudyChart days={overview.week} />
              <RecentStudyCard sessions={overview.sessions} />
            </div>
          </>
        )}
      </div>
    </Section>
  );
}

function RecentStudyCard({ sessions }: { sessions: LearningSessionItem[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" />
            最近学习
          </CardTitle>
          <Button href="/progress" variant="ghost" size="sm" trailingIcon={<ArrowRight className="h-4 w-4" />}>
            查看全部
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.length > 0 ? (
          sessions.slice(0, 5).map((session) => <SessionRow key={session.id} session={session} />)
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-sm leading-6 text-muted-foreground">
            还没有学习记录。先完成一个今日任务，系统会把学习时间、正确率和完成量记录到这里。
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SessionRow({ session }: { session: LearningSessionItem }) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-background p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <History className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="truncate text-sm font-medium">{session.title}</p>
          <span className="text-xs text-muted-foreground">{formatDateTime(session.startedAt)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {moduleLabel(session.module)} · {session.durationMinutes} 分钟 · {session.itemsCompleted} 项
          {session.accuracy !== null ? ` · 正确率 ${session.accuracy}%` : ""}
        </p>
      </div>
    </div>
  );
}

function formatMinutes(minutes: number) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function moduleLabel(value: string) {
  switch (value) {
    case "vocabulary":
      return "单词";
    case "grammar":
      return "语法";
    case "reading":
      return "阅读";
    case "practice":
      return "练习";
    case "jlpt_mock":
    case "jlpt":
      return "JLPT";
    case "review":
      return "复习";
    case "study":
      return "学习";
    default:
      return "学习";
  }
}
