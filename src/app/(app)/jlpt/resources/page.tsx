import type { Metadata } from "next";
import { ArrowLeft, Download, FileUp, LinkIcon, ShieldCheck } from "lucide-react";
import { JlptResourceCard } from "@/components/jlpt/jlpt-resource-card";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUserProfile, isAuthPreviewEnabled, requireUser } from "@/lib/auth";
import { getJlptResources, normalizePreviewPlan } from "@/lib/jlpt";

export const metadata: Metadata = {
  title: "JLPT 授权资料入口",
  description: "管理员可配置授权文件、外部网盘链接和价格，不提供未经授权的官方 JLPT 真题。"
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const previewPlan = normalizePreviewPlan(params.plan);
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user);
  const result = await getJlptResources(supabase, user, previewPlan);
  const pagePlan = isAuthPreviewEnabled() ? result.accountTier : undefined;

  return (
    <Section>
      <div className="space-y-8">
        <Button href={`/jlpt${pagePlan ? `?plan=${pagePlan}` : ""}`} variant="ghost" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
          返回 JLPT
        </Button>

        <PageHeader
          eyebrow="Authorized Resources"
          title="JLPT 授权资料入口"
          description={`当前目标 ${profile.target_jlpt_level}。这里预留授权真题资料、文件上传和网盘链接的商业入口。`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={result.accountTier === "pro" ? "accent" : "outline"}>{result.accountTier.toUpperCase()}</Badge>
              <Badge variant="muted">管理员配置</Badge>
            </div>
          }
        />

        <Card className="border-primary/30">
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <ResourcePrinciple icon={<ShieldCheck className="h-4 w-4" />} title="授权优先" detail="未确认授权的官方真题不开放下载。" />
            <ResourcePrinciple icon={<FileUp className="h-4 w-4" />} title="文件上传" detail="未来通过 Supabase Storage 保存授权文件。" />
            <ResourcePrinciple icon={<LinkIcon className="h-4 w-4" />} title="外部链接" detail="管理员也可以配置已获授权的网盘或官方链接。" />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {result.resources.map((resource) => (
            <JlptResourceCard key={resource.id} resource={resource} />
          ))}
        </div>

        <Card className="border-dashed">
          <CardContent className="flex gap-3 p-4 text-sm leading-6 text-muted-foreground">
            <Download className="mt-1 h-4 w-4 shrink-0 text-primary" />
            <p>管理端设计：资源按 N1-N5 建档，字段包含价格、币种、访问层级、文件路径、外部链接、授权状态和发布状态。支付系统接入前不会实际扣费。</p>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

function ResourcePrinciple({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex gap-3 rounded-lg bg-muted p-4">
      <div className="mt-0.5 text-primary">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
