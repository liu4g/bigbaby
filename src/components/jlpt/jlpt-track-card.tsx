import Link from "next/link";
import { BookOpenCheck, ChevronRight, Lock, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { getJlptLevelHref } from "@/lib/jlpt";
import { jlptSectionZhLabels, type JlptLevelTrack } from "@/lib/jlpt-data";
import { levelTone } from "@/lib/site";
import type { AccountTier } from "@/lib/vocabulary";

export function JlptTrackCard({ track, accountTier, plan }: { track: JlptLevelTrack; accountTier: AccountTier; plan?: AccountTier }) {
  const isLocked = accountTier === "free" && (track.level === "N2" || track.level === "N1");

  return (
    <Card className="flex min-h-[300px] flex-col overflow-hidden">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={levelTone(track.level)}>{track.level}</Badge>
              <Badge variant={isLocked ? "warning" : "success"}>{isLocked ? "PRO" : "FREE"}</Badge>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">{track.title}</h2>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {isLocked ? <Lock className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-sm leading-6 text-muted-foreground">
          {isLocked ? "PRO 解锁后查看完整 N2 / N1 原创模拟考试、听力专项和薄弱点分析。" : track.description}
        </p>

        <div className="grid gap-2">
          {track.modules.map((module) => (
            <div key={module.title} className="flex items-center gap-2 rounded-lg bg-muted p-2 text-sm">
              <BookOpenCheck className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium">{module.title}</span>
              <span className="truncate text-muted-foreground">
                {module.kind === "mock_exam" ? "原创模拟考试" : jlptSectionZhLabels[module.kind]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href={getJlptLevelHref(track.level, plan)}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          查看等级
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
