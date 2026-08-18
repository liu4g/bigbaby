import type { Metadata } from "next";
import { ArrowRight, BarChart3, BookOpenCheck, Brain, CalendarCheck, CheckCircle2, Clock3, Flame, ListChecks, RotateCcw, Target } from "lucide-react";
import { DailyStudyPlan } from "@/components/learning/daily-study-plan";
import { WeeklyStudyChart } from "@/components/learning/weekly-study-chart";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { SubscriptionPaywall } from "@/components/subscription/subscription-paywall";
import { getAccountTier, normalizePreviewPlan } from "@/lib/access-control";
import { getUserProfile, requireUser } from "@/lib/auth";
import { getLearningOverview, type LearningSessionItem } from "@/lib/learning";

export const metadata: Metadata = {
  title: "学习记录",
  description: "查看每日学习量、连续学习、学习时间、正确率、单词掌握度和语法掌握度。"
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProgressPage({
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
  const isLocked = overview.isLocked;

  return (
    <Section>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Progress"
          title="学习记录"
          description="把学习时间、完成状态、正确率、单词掌握度和语法掌握度放在同一个视图里，方便每天调整节奏。"
          actions={
            <>
              <Button href="/practice/wrong-answers" variant="outline" leadingIcon={<RotateCcw className="h-4 w-4" />}>
                错题复习
              </Button>
              <Button href="/dashboard" trailingIcon={<ArrowRight className="h-4 w-4" />}>
                回到今日计划
              </Button>
            </>
          }
        />

        {isLocked ? (
          <div className="space-y-4">
            <SubscriptionPaywall
              title="学习记录属于 PRO"
              description="FREE 用户可以继续完成 N5-N3 内容练习；升级后会解锁学习时间、本周趋势、连续学习、掌握度、每日学习量和学习路径。"
              features={[
                "今日学习与本周学习趋势",
                "连续学习天数",
                "单词与语法掌握度",
                "Daily Study Plan"
              ]}
            />
            <EmptyState
              title="先继续练习"
              description="学习记录功能已锁定，但你仍然可以继续学习免费内容，之后再回来看自己的学习历史。"
              actionLabel="去练习"
              actionHref="/practice"
              icon={<ListChecks className="h-5 w-5" />}
            />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="今日学习" value={`${metrics.todayMinutes}m`} hint={`目标 ${metrics.dailyTargetMinutes}m`} icon={<Clock3 className="h-4 w-4" />} />
              <StatCard label="本周学习" value={formatMinutes(metrics.weeklyMinutes)} hint="最近 7 天累计" icon={<BarChart3 className="h-4 w-4" />} tone="accent" />
              <StatCard label="连续学习" value={`${metrics.streakDays} 天`} hint="按学习日期去重" icon={<Flame className="h-4 w-4" />} tone="warning" />
              <StatCard label="正确率" value={`${metrics.averageAccuracy}%`} hint="练习与任务综合" icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
              <StatCard label="掌握单词" value={`${metrics.masteredVocabulary}`} hint={`平均 ${metrics.vocabularyMastery}%`} icon={<BookOpenCheck className="h-4 w-4" />} />
              <StatCard label="掌握语法" value={`${metrics.masteredGrammar}`} hint={`平均 ${metrics.grammarMastery}%`} icon={<Brain className="h-4 w-4" />} tone="accent" />
              <StatCard label="每日学习量" value={`${metrics.dailyCompletedItems}/${metrics.dailyTargetItems}`} hint="今日计划项目" icon={<ListChecks className="h-4 w-4" />} />
              <StatCard label="学习目标" value={profile.target_jlpt_level} hint={`当前 ${profile.jlpt_level}`} icon={<Target className="h-4 w-4" />} tone="success" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
              <WeeklyStudyChart days={overview.week} />

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">模块掌握度</CardTitle>
                    <Badge variant="outline">{profile.target_jlpt_level}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {overview.masteryByModule.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-muted-foreground">{item.detail}</span>
                      </div>
                      <Progress value={item.value} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <DailyStudyPlan tasks={overview.tasks} returnTo="/progress" plan={accountTier} />

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CalendarCheck className="h-4 w-4 text-primary" />
                      最近学习记录
                    </CardTitle>
                    <Badge variant="muted">{overview.todayKey}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {overview.sessions.length > 0 ? (
                    overview.sessions.map((session) => <SessionRow key={session.id} session={session} />)
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-6 text-sm leading-6 text-muted-foreground">
                      暂时没有学习记录。完成今日计划后，这里会显示学习内容、完成状态、学习时间和正确率。
                    </div>
                  )}
                </CardContent>
              </Card>

              <EmptyState
                title="学习路径已准备好"
                description={overview.pathSummary}
                actionLabel="开始练习"
                actionHref="/practice"
                icon={<ListChecks className="h-5 w-5" />}
              />
            </div>
          </>
        )}
      </div>
    </Section>
  );
}

function SessionRow({ session }: { session: LearningSessionItem }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">{session.title}</p>
        <span className="text-xs text-muted-foreground">{formatDateTime(session.startedAt)}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {moduleLabel(session.module)} · {session.durationMinutes} 分钟 · 完成 {session.itemsCompleted} 项
        {session.accuracy !== null ? ` · 正确率 ${session.accuracy}%` : ""}
      </p>
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
