import type { Metadata } from "next";
import { AlertTriangle, BookOpenCheck, Download, ShieldCheck, Trophy } from "lucide-react";
import { JlptExamCard } from "@/components/jlpt/jlpt-exam-card";
import { JlptTrackCard } from "@/components/jlpt/jlpt-track-card";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUserProfile, isAuthPreviewEnabled, requireUser } from "@/lib/auth";
import { getJlptOverview, normalizePreviewPlan } from "@/lib/jlpt";

export const metadata: Metadata = {
  title: "JLPT",
  description: "JLPT 风格原创模拟考试和专项训练，不使用未经授权的官方真题。"
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const previewPlan = normalizePreviewPlan(params.plan);
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user);
  const result = await getJlptOverview(supabase, user, previewPlan);
  const pagePlan = isAuthPreviewEnabled() ? result.accountTier : undefined;

  return (
    <Section>
      <div className="space-y-8">
        <PageHeader
          eyebrow="JLPT"
          title="JLPT 原创模拟考试"
          description={`当前目标 ${profile.target_jlpt_level}。按 N5-N1 管理专项训练、计时考试、错题解析和薄弱点分析。`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={result.accountTier === "pro" ? "accent" : "outline"}>{result.accountTier.toUpperCase()}</Badge>
              <Badge variant="muted">原创模拟题</Badge>
            </div>
          }
        />

        {isAuthPreviewEnabled() ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">权限预览</span>
            <Button href="/jlpt?plan=free" size="sm" variant={result.accountTier === "free" ? "default" : "outline"}>
              FREE 用户
            </Button>
            <Button href="/jlpt?plan=pro" size="sm" variant={result.accountTier === "pro" ? "default" : "outline"}>
              PRO 用户
            </Button>
            <span>真实环境下由 subscriptions 在服务端判断。</span>
          </div>
        ) : null}

        <Card className="border-primary/30">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">版权策略</p>
              <p className="text-sm leading-6 text-muted-foreground">
                平台商业内容以原创 JLPT 风格模拟题为主。官方真题只保留授权资料入口，管理员必须确认授权后才能配置文件或外部链接。
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={<Trophy className="h-4 w-4" />} label="模拟考试" value={result.stats.exams} />
          <Metric icon={<BookOpenCheck className="h-4 w-4" />} label="可访问" value={result.stats.unlocked} tone="success" />
          <Metric icon={<ShieldCheck className="h-4 w-4" />} label="原创内容" value={result.stats.originalExams} />
          <Metric icon={<Download className="h-4 w-4" />} label="资料入口" value={result.stats.resourceEntries} tone="warning" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.tracks.map((track) => (
            <JlptTrackCard key={track.level} track={track} accountTier={result.accountTier} plan={pagePlan} />
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Mock Exam</h2>
              <p className="mt-1 text-sm text-muted-foreground">N1-N5 原创模拟考试，支持计时、暂停、提交和解析。</p>
            </div>
            <Button href="/jlpt/resources" variant="outline" leadingIcon={<Download className="h-4 w-4" />}>
              授权资料入口
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.exams.map((exam) => (
              <JlptExamCard key={exam.id} exam={exam} plan={pagePlan} />
            ))}
          </div>
        </div>

        <Card className="border-warning/30">
          <CardContent className="flex gap-3 p-4 text-sm leading-6 text-muted-foreground">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-warning" />
            <p>真题下载入口只用于已授权文件或允许分发的外部链接。当前不会上传或复制未经授权的官方 JLPT 真题。</p>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

function Metric({
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
