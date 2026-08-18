import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeeklyStudyDay } from "@/lib/learning";
import { cn } from "@/lib/utils";

export function WeeklyStudyChart({ days, title = "本周学习趋势" }: { days: WeeklyStudyDay[]; title?: string }) {
  const maxMinutes = Math.max(...days.map((day) => day.minutes), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {days.map((day) => {
            const percent = Math.round((day.minutes / maxMinutes) * 100);

            return (
              <div key={day.date} className="flex h-44 flex-col justify-end gap-2 rounded-lg border border-border bg-background p-2">
                <div className="flex-1 flex items-end justify-center">
                  <div className="flex h-full w-full items-end justify-center">
                    <div
                      className={cn("w-full max-w-8 rounded-md bg-primary transition-all", day.isToday ? "bg-accent" : "")}
                      style={{ height: `${Math.max(16, percent)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-xs font-medium">{day.minutes}m</p>
                  <p className={cn("text-xs text-muted-foreground", day.isToday ? "text-foreground" : "")}>{day.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
