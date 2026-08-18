import Link from "next/link";
import { ArrowRight, Clock3, Lock, PenTool, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getPracticeSetHref } from "@/lib/practice";
import { practiceKindLabels, type PracticeSetWithState } from "@/lib/practice-data";
import { levelTone } from "@/lib/site";
import type { AccountTier } from "@/lib/vocabulary";

export function PracticeCard({ item, plan }: { item: PracticeSetWithState; plan?: AccountTier }) {
  const detailHref = getPracticeSetHref(item.slug, plan);
  const questionTypeCount = new Set(item.questions.map((question) => question.questionType)).size;
  const questionLabel = item.isLocked ? "PRO" : `${item.questions.length} 题`;
  const minuteLabel = item.isLocked ? "解锁" : `${item.estimatedMinutes} 分钟`;

  return (
    <Card className="flex min-h-[300px] flex-col overflow-hidden">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={levelTone(item.jlptLevel)}>{item.jlptLevel}</Badge>
              <Badge variant={item.accessTier === "pro" ? "warning" : "outline"}>{item.accessTier.toUpperCase()}</Badge>
              <Badge variant="muted">{practiceKindLabels[item.kind]}</Badge>
              {item.isJlptStyle ? <Badge variant="accent">JLPT 风格原创</Badge> : null}
            </div>
            <Link href={detailHref} className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <h2 className="line-clamp-1 text-xl font-semibold tracking-tight text-foreground">{item.title}</h2>
            </Link>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {item.isLocked ? <Lock className="h-4 w-4" /> : <PenTool className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        {item.isLocked ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            N2 / N1 高级练习由服务端权限和 Supabase RLS 锁定。升级 PRO 后可访问完整题目、解析和错题记录。
          </div>
        ) : (
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
        )}

        <div className="grid grid-cols-3 gap-2 text-xs">
          <InfoPill icon={<PenTool className="h-3.5 w-3.5" />} label={questionLabel} />
          <InfoPill icon={<Clock3 className="h-3.5 w-3.5" />} label={minuteLabel} />
          <InfoPill icon={<RotateCcw className="h-3.5 w-3.5" />} label={`${item.wrongCount} 错题`} />
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{item.isLocked ? "高级题型" : `${questionTypeCount} 种题型`}</span>
            {item.lastPracticedAt ? <span>/ 最近 {new Date(item.lastPracticedAt).toLocaleDateString("zh-CN")}</span> : null}
          </div>
          <Progress value={item.bestAccuracy} label="历史最好正确率" />
        </div>
      </CardContent>

      <CardFooter>
        <Link
          href={detailHref}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          {item.isLocked ? "查看权限" : "开始练习"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-muted px-2 text-muted-foreground">
      {icon}
      <span className="truncate">{label}</span>
    </div>
  );
}
