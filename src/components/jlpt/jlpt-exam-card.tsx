import Link from "next/link";
import { ArrowRight, Clock3, Lock, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getJlptExamHref } from "@/lib/jlpt";
import { levelTone } from "@/lib/site";
import type { JlptExamWithState } from "@/lib/jlpt-data";
import type { AccountTier } from "@/lib/vocabulary";

export function JlptExamCard({ exam, plan }: { exam: JlptExamWithState; plan?: AccountTier }) {
  const href = getJlptExamHref(exam.slug, plan);
  const questionCount = exam.sections.reduce((sum, section) => sum + section.questions.length, 0);

  return (
    <Card className="flex min-h-[260px] flex-col">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={levelTone(exam.level)}>{exam.level}</Badge>
              <Badge variant={exam.accessTier === "pro" ? "warning" : "outline"}>{exam.accessTier.toUpperCase()}</Badge>
              <Badge variant="accent">原创</Badge>
            </div>
            <Link href={href} className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <h2 className="text-lg font-semibold tracking-tight">{exam.title}</h2>
            </Link>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {exam.isLocked ? <Lock className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{exam.description}</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Info label={exam.isLocked ? "PRO" : `${questionCount} 题`} />
          <Info label={exam.isLocked ? "解锁" : `${Math.round(exam.durationSeconds / 60)} 分钟`} icon={<Clock3 className="h-3.5 w-3.5" />} />
          <Info label={`${exam.totalScore} 分`} />
        </div>
        <div className="mt-auto">
          <Progress value={exam.bestScore} label="历史最高分" />
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href={href}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          {exam.isLocked ? "查看权限" : "进入考试"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}

function Info({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-muted px-2 text-muted-foreground">
      {icon}
      <span className="truncate">{label}</span>
    </div>
  );
}
