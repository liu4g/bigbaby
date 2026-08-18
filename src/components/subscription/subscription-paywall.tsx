import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SubscriptionPaywall({
  title,
  description,
  features,
  actionLabel = "查看会员信息",
  actionHref = "/profile"
}: {
  title: string;
  description: string;
  features: string[];
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
            <Lock className="h-5 w-5" />
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">PRO</Badge>
              <Badge variant="muted">Server validated</Badge>
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
        <Button href={actionHref} variant="outline" leadingIcon={<ShieldCheck className="h-4 w-4" />}>
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
