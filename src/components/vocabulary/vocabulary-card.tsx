import Link from "next/link";
import { ArrowRight, Lock, Volume2 } from "lucide-react";
import { VocabularyActionButtons } from "@/components/vocabulary/vocabulary-action-buttons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { levelTone } from "@/lib/site";
import { getVocabularyLevelHref, type AccountTier } from "@/lib/vocabulary";
import { vocabularyStatusLabels, type VocabularyWithState } from "@/lib/vocabulary-data";

export function VocabularyCard({
  item,
  returnTo,
  plan
}: {
  item: VocabularyWithState;
  returnTo: string;
  plan?: AccountTier;
}) {
  const detailHref = plan ? `/vocabulary/${item.slug}?plan=${plan}` : `/vocabulary/${item.slug}`;
  const firstExample = item.examples[0];

  return (
    <Card className="flex min-h-[320px] flex-col overflow-hidden">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={levelTone(item.jlptLevel)}>{item.jlptLevel}</Badge>
              <Badge variant={item.accessTier === "pro" ? "warning" : "outline"}>
                {item.accessTier === "pro" ? "PRO" : "FREE"}
              </Badge>
              <Badge variant="muted">{item.categoryLabel}</Badge>
            </div>
            <Link href={detailHref} className="block space-y-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <h2 className="truncate text-2xl font-semibold tracking-tight text-foreground">{item.word}</h2>
              <p className="text-sm text-muted-foreground">{item.reading}</p>
            </Link>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {item.isLocked ? <Lock className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        {item.isLocked ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            N2 / N1 高级词库由服务器权限锁定。升级 PRO 后可查看完整释义、例句、近义词和复习状态。
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{item.meaning}</p>
              <p className="text-sm leading-6 text-muted-foreground">{item.notes}</p>
            </div>

            {firstExample ? (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium text-foreground">{firstExample.japanese}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{firstExample.meaning}</p>
              </div>
            ) : null}
          </>
        )}

        <div className="mt-auto space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{item.partOfSpeechLabel}</span>
            <span aria-hidden="true">/</span>
            <span>音调 {item.pitchAccent}</span>
            <span aria-hidden="true">/</span>
            <span>{vocabularyStatusLabels[item.status]}</span>
          </div>
          <Progress value={item.masteryScore} label="掌握度" />
        </div>
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <VocabularyActionButtons item={item} returnTo={returnTo} plan={plan} compact />
        <Link
          href={detailHref}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          查看
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}

export function VocabularyLockedLevelCard({ level, plan }: { level: "N2" | "N1"; plan?: AccountTier }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge variant="warning">PRO</Badge>
            <h2 className="mt-3 text-lg font-semibold">{level} 高级词库</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">FREE 用户只能访问 N5-N3。此等级内容会在数据库 RLS 层被拦截。</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
            <Lock className="h-4 w-4" />
          </div>
        </div>
        <Link
          href={getVocabularyLevelHref(level, { plan })}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border text-sm font-medium transition-colors hover:bg-muted"
        >
          查看权限状态
        </Link>
      </CardContent>
    </Card>
  );
}
