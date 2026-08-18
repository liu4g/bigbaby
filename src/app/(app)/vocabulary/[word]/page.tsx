import type { Metadata } from "next";
import { ArrowLeft, BookOpenCheck, CheckCircle2, Clock3, Lock, Tag } from "lucide-react";
import { VocabularyActionButtons } from "@/components/vocabulary/vocabulary-action-buttons";
import { VocabularyPaywall } from "@/components/vocabulary/vocabulary-paywall";
import { VocabularyQuiz } from "@/components/vocabulary/vocabulary-quiz";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { getUserProfile, requireUser } from "@/lib/auth";
import { levelTone } from "@/lib/site";
import { getVocabularyDetail, normalizePreviewPlan } from "@/lib/vocabulary";
import { vocabularyEntries, vocabularyStatusLabels } from "@/lib/vocabulary-data";

type Params = { word: string };
type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { word } = await params;
  const entry = vocabularyEntries.find((item) => item.slug === decodeURIComponent(word));

  return {
    title: entry ? `${entry.word} - 单词` : "单词详情",
    description: entry ? `${entry.word}（${entry.reading}）单词详情、学习状态和测试。` : "查看日语单词释义、例句、学习状态和单词测试。"
  };
}

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<Params>;
  searchParams?: Promise<SearchParams>;
}) {
  const [{ word }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const previewPlan = normalizePreviewPlan(resolvedSearchParams?.plan);
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user);
  const result = await getVocabularyDetail(supabase, user, decodeURIComponent(word), previewPlan);
  const pagePlan = result.isPreview ? result.accountTier : undefined;

  if (!result.item && result.isLocked) {
    return (
      <Section>
        <div className="space-y-6">
          <Button href="/vocabulary" variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
            返回单词库
          </Button>
          <PageHeader
            eyebrow="Vocabulary"
            title="高级词库"
            description="当前账户没有访问这个单词的权限。"
            actions={<Badge variant="outline">{result.accountTier.toUpperCase()}</Badge>}
          />
          <VocabularyPaywall />
        </div>
      </Section>
    );
  }

  if (!result.item) {
    return (
      <Section>
        <EmptyState
          title="没有找到这个单词"
          description="这个词条可能尚未发布，或当前账户没有访问权限。"
          actionLabel="返回单词库"
          actionHref="/vocabulary"
          icon={<BookOpenCheck className="h-5 w-5" />}
        />
      </Section>
    );
  }

  const item = result.item;
  const returnTo = pagePlan ? `/vocabulary/${item.slug}?plan=${pagePlan}` : `/vocabulary/${item.slug}`;

  return (
    <Section>
      <div className="space-y-8">
        <Button href={`/vocabulary/${item.jlptLevel.toLowerCase()}${pagePlan ? `?plan=${pagePlan}` : ""}`} variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
          返回 {item.jlptLevel}
        </Button>

        <PageHeader
          eyebrow="Vocabulary"
          title={item.word}
          description={item.isLocked ? "此单词属于 PRO 高级词库，FREE 账户不能查看完整内容。" : `${item.reading} / ${item.romaji}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={levelTone(item.jlptLevel)}>{item.jlptLevel}</Badge>
              <Badge variant={item.accessTier === "pro" ? "warning" : "outline"}>{item.accessTier.toUpperCase()}</Badge>
              <Badge variant="muted">目标 {profile.target_jlpt_level}</Badge>
            </div>
          }
        />

        {item.isLocked ? (
          <VocabularyPaywall level={item.jlptLevel} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">释义与用法</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoCell label="读音" value={item.reading} />
                    <InfoCell label="词性" value={item.partOfSpeechLabel} />
                    <InfoCell label="音调" value={item.pitchAccent} />
                    <InfoCell label="分类" value={item.categoryLabel} />
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Meaning</p>
                    <p className="mt-2 text-lg font-semibold">{item.meaning}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.notes}</p>
                  </div>

                  <TagList title="近义词" items={item.synonyms} fallback="暂无近义词" />
                  <TagList title="反义词" items={item.antonyms} fallback="暂无反义词" />
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
                    <InfoCell label="状态" value={vocabularyStatusLabels[item.status]} />
                    <InfoCell label="下次复习" value={item.nextReviewAt ? new Date(item.nextReviewAt).toLocaleDateString("zh-CN") : "未加入"} />
                  </div>
                  <Progress value={item.masteryScore} label="掌握度" />
                  <VocabularyActionButtons item={item} returnTo={returnTo} plan={pagePlan} />
                </CardContent>
              </Card>

              <VocabularyQuiz word={item.word} reading={item.reading} correctMeaning={item.meaning} choices={result.quizChoices} />

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

function TagList({ title, items, fallback }: { title: string; items: string[]; fallback: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Tag className="h-4 w-4 text-primary" />
        {title}
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
        <p className="text-sm text-muted-foreground">{fallback}</p>
      )}
    </div>
  );
}
