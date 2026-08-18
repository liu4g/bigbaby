import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ErrorState({
  title,
  description,
  actionLabel,
  actionHref
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">!</div>
        <div className="max-w-sm space-y-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {actionLabel && actionHref ? <Button href={actionHref}>{actionLabel}</Button> : null}
      </CardContent>
    </Card>
  );
}
