import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        {icon ? <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</div> : null}
        <div className="max-w-sm space-y-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {actionLabel && actionHref ? <Button href={actionHref}>{actionLabel}</Button> : null}
      </CardContent>
    </Card>
  );
}
