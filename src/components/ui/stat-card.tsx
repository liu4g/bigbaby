import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default"
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "accent" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "accent"
        ? "bg-accent/15 text-accent-foreground"
        : tone === "warning"
          ? "bg-warning/15 text-foreground"
          : "bg-primary/10 text-primary";

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4 sm:p-5">
        {icon ? <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", toneClass)}>{icon}</div> : null}
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tracking-tight">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
