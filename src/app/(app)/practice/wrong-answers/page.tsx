import type { Metadata } from "next";
import { ArrowLeft, CircleAlert, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SubscriptionPaywall } from "@/components/subscription/subscription-paywall";
import { canAccess, getAccountTier, normalizePreviewPlan } from "@/lib/access-control";
import { getUserProfile, requireUser } from "@/lib/auth";
import { getPracticeSetHref, getWrongAnswerList, type PracticeWrongAnswerItem } from "@/lib/practice";
import { practiceKindLabels, questionTypeLabels } from "@/lib/practice-data";
import { levelTone } from "@/lib/site";

export const metadata: Metadata = {
  title: "Wrong Answers",
  description: "查看并重新练习日语学习平台中的错题。"
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
  const accountTier = await getAccountTier(supabase, user, previewPlan);
  const allowed = await canAccess(user, { kind: "feature", feature: "wrong_answers" }, { supabase, previewPlan: accountTier });

  if (!allowed) {
    return (
      <Section>
        <div className="space-y-8">
          <Button href="/practice" variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
            返回练习中心
          </Button>

          <PageHeader
            eyebrow="Wrong Answers"
            title="错题本"
            description={`当前目标 ${profile.target_jlpt_level}。错题本属于 PRO 功能，升级后可以自动记录、复练和追踪薄弱点。`}
            actions={<Badge variant={accountTier === "pro" ? "accent" : "outline"}>{accountTier.toUpperCase()}</Badge>}
          />

          <SubscriptionPaywall
            title="错题本属于 PRO"
            description="FREE 用户仍然可以完成基础练习；升级后会自动整理错题、恢复练习记录并生成复习队列。"
            features={[
              "自动收集错题",
              "错题重新练习",
              "答案解析与薄弱点",
              "学习记录联动"
            ]}
          />
        </div>
      </Section>
    );
  }

  const result = await getWrongAnswerList(supabase, user, previewPlan);
  const pagePlan = result.isPreview ? result.accountTier : undefined;

  return (
    <Section>
      <div className="space-y-8">
        <Button href="/practice" variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
          返回练习中心
        </Button>

        <PageHeader
          eyebrow="Wrong Answers"
          title="错题本"
          description={`当前目标 ${profile.target_jlpt_level}。错误题目会自动进入这里，重新练习正确后会标记为已解决。`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={result.accountTier === "pro" ? "accent" : "outline"}>{result.accountTier.toUpperCase()}</Badge>
              <Badge variant="muted">{result.items.length} 待复习</Badge>
            </div>
          }
        />

        {result.items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {result.items.map((item) => (
              <WrongAnswerCard key={item.questionId} item={item} plan={pagePlan} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="暂时没有待复习错题"
            description="完成练习后，答错的题目会自动加入 Wrong Answers。"
            actionLabel="开始练习"
            actionHref="/practice"
            icon={<CircleAlert className="h-5 w-5" />}
          />
        )}
      </div>
    </Section>
  );
}

function WrongAnswerCard({ item, plan }: { item: PracticeWrongAnswerItem; plan?: "free" | "pro" }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={levelTone(item.jlptLevel)}>{item.jlptLevel}</Badge>
          <Badge variant="muted">{practiceKindLabels[item.kind]}</Badge>
          <Badge variant="outline">{questionTypeLabels[item.questionType]}</Badge>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold leading-7">{item.question}</h2>
          <p className="text-sm text-muted-foreground">{item.practiceSetTitle}</p>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs">错误次数</p>
            <p className="mt-1 font-semibold text-foreground">{item.wrongCount}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs">最近错误</p>
            <p className="mt-1 font-semibold text-foreground">{new Date(item.lastWrongAt).toLocaleDateString("zh-CN")}</p>
          </div>
        </div>

        {item.notes ? <p className="text-sm leading-6 text-muted-foreground">{item.notes}</p> : null}

        <Button
          href={getPracticeSetHref(item.practiceSetSlug, plan)}
          variant="outline"
          leadingIcon={<RotateCcw className="h-4 w-4" />}
        >
          重新练习
        </Button>
      </CardContent>
    </Card>
  );
}
