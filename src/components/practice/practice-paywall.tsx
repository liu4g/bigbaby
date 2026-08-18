import { Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PracticePaywall({ level }: { level?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
            <Lock className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">PRO</Badge>
              {level ? <Badge variant="outline">{level}</Badge> : null}
              <Badge variant="muted">Server + RLS</Badge>
            </div>
            <h2 className="text-base font-semibold">高级练习已由权限层锁定</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              FREE 用户可以练习 N5-N3 基础内容。N2/N1 高级练习会在服务端和 Supabase RLS 中校验，提交答案时也会再次检查订阅权限。
            </p>
          </div>
        </div>
        <Button href="/profile" variant="outline" leadingIcon={<ShieldCheck className="h-4 w-4" />}>
          查看账户状态
        </Button>
      </CardContent>
    </Card>
  );
}
