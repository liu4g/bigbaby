import Link from "next/link";
import { ArrowRight, Lock, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Level } from "@/lib/site";

export function ContentCard({
  href,
  title,
  description,
  level,
  meta,
  progress,
  locked,
  icon,
  className
}: {
  href: string;
  title: string;
  description: string;
  level: Level;
  meta: string[];
  progress?: number;
  locked?: boolean;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden transition-transform hover:-translate-y-0.5", className)}>
      <Link href={href} className="block">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {icon}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold leading-6">{title}</h3>
                <Badge variant="outline">{level}</Badge>
                {locked ? (
                  <Badge variant="muted">
                    <Lock className="mr-1 h-3 w-3" />
                    PRO
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {meta.map((item) => (
              <span key={item} className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
                <Clock3 className="h-3 w-3" />
                {item}
              </span>
            ))}
          </div>

          {typeof progress === "number" ? <Progress value={progress} label="学习进度" /> : null}
        </CardContent>
        <CardFooter>
          <span className="text-sm text-muted-foreground">查看详情</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardFooter>
      </Link>
    </Card>
  );
}
