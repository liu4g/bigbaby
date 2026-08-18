import { BookOpen, CheckCircle2, Clock3, Newspaper, PenTool, RotateCcw, Sigma, Sparkles, Target } from "lucide-react";
import { completeDailyTaskAction } from "@/app/actions/learning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DailyStudyTask } from "@/lib/learning";
import { cn } from "@/lib/utils";

const iconMap = {
  vocabulary: BookOpen,
  grammar: Sigma,
  reading: Newspaper,
  practice: PenTool,
  jlpt: Target,
  review: RotateCcw
} as const;

export function DailyStudyPlan({ tasks, returnTo, plan }: { tasks: DailyStudyTask[]; returnTo: string; plan?: "free" | "pro" }) {
  const totalTarget = tasks.reduce((sum, task) => sum + task.targetCount, 0);
  const totalCompleted = tasks.reduce((sum, task) => sum + Math.min(task.completedCount, task.targetCount), 0);
  const totalMinutes = tasks.reduce((sum, task) => sum + task.targetMinutes, 0);
  const completedMinutes = tasks.reduce((sum, task) => sum + Math.min(task.completedMinutes, task.targetMinutes), 0);
  const percent = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Daily Study Plan
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">今天的学习任务已经按单词、语法、阅读和练习排好。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{totalCompleted}/{totalTarget} 项</Badge>
            <Badge variant="muted">{completedMinutes}/{totalMinutes} 分钟</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={percent} label="今日路径完成度" />

        <div className="space-y-3">
          {tasks.map((task, index) => {
            const Icon = iconMap[task.taskType];
            const taskPercent = Math.round((Math.min(task.completedCount, task.targetCount) / task.targetCount) * 100);
            const isCompleted = task.status === "completed";

            return (
              <div key={task.id} className={cn("rounded-lg border border-border bg-background p-4", isCompleted ? "bg-success/5" : "")}> 
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold">{index + 1}</span>
                      <Badge variant="outline">{task.targetLevel}</Badge>
                      <Badge variant={isCompleted ? "success" : task.status === "in_progress" ? "accent" : "muted"}>{isCompleted ? "已完成" : task.status === "in_progress" ? "进行中" : "待开始"}</Badge>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-sm font-semibold leading-6">{task.title}</h3>
                        <p className="text-sm leading-6 text-muted-foreground">{task.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{task.targetCount} 项</p>
                      <p>{task.targetMinutes} 分钟</p>
                    </div>
                    <form action={completeDailyTaskAction}>
                      <input type="hidden" name="task_type" value={task.taskType} />
                      <input type="hidden" name="return_to" value={returnTo} />
                      {plan ? <input type="hidden" name="plan" value={plan} /> : null}
                      <Button type="submit" size="sm" variant={isCompleted ? "outline" : "default"} leadingIcon={isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}>
                        {isCompleted ? "已完成" : "标记完成"}
                      </Button>
                    </form>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.min(task.completedCount, task.targetCount)}/{task.targetCount} 项</span>
                    <span>{taskPercent}%</span>
                  </div>
                  <Progress value={taskPercent} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
