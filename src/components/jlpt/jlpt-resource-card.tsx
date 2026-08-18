import { ExternalLink, FileUp, Lock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { levelTone } from "@/lib/site";
import type { JlptDownloadResource } from "@/lib/jlpt-data";

export function JlptResourceCard({
  resource
}: {
  resource: JlptDownloadResource & { canAccess?: boolean };
}) {
  const price = resource.priceCents === null ? "待定" : resource.priceCents === 0 ? "免费" : `¥${(resource.priceCents / 100).toFixed(0)}`;
  const canAccess = resource.canAccess ?? true;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={levelTone(resource.level)}>{resource.level}</Badge>
          <Badge variant={resource.accessTier === "pro" ? "warning" : "outline"}>{resource.accessTier.toUpperCase()}</Badge>
          <Badge variant={resource.status === "available" ? "success" : "muted"}>{resource.status === "available" ? "可下载" : "预留入口"}</Badge>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold leading-7">{resource.title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{resource.description}</p>
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-muted-foreground">
            <Tag className="h-4 w-4 text-primary" />
            <span>{price}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-muted-foreground">
            {resource.deliveryTypes.includes("file_upload") ? <FileUp className="h-4 w-4 text-primary" /> : <ExternalLink className="h-4 w-4 text-primary" />}
            <span>文件 / 网盘链接</span>
          </div>
        </div>

        <Button variant="outline" disabled={!canAccess || resource.status !== "available"} leadingIcon={!canAccess ? <Lock className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}>
          {resource.status === "available" ? "获取资源" : "等待配置"}
        </Button>
      </CardContent>
    </Card>
  );
}
