import type { Metadata } from "next";
import { ArrowRight, BookOpenCheck, ChartNoAxesColumnIncreasing, CheckCircle2, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Section } from "@/components/layout/section";
import { landingHighlights } from "@/lib/site";

export const metadata: Metadata = {
  title: "现代化日语学习平台",
  description: "覆盖 N5～N1 的日语学习平台，提供单词、语法、文章、练习和 JLPT 风格原创训练。"
};

const modules = [
  { title: "单词", detail: "分级词库、例句、复习状态", href: "/vocabulary" },
  { title: "语法", detail: "句型、用法、辨析与练习", href: "/grammar" },
  { title: "文章", detail: "阅读材料、重点词汇与语法", href: "/reading" },
  { title: "练习", detail: "选择、填空、阅读理解", href: "/practice" },
  { title: "JLPT", detail: "原创专项训练与未来模考", href: "/jlpt" },
  { title: "学习记录", detail: "进度、连续天数、错题入口", href: "/progress" }
];

const planRows = [
  ["N5～N3 单词/语法/文章", true, true],
  ["N5～N3 基础练习", true, true],
  ["N2/N1 高级内容", false, true],
  ["完整练习、错题本、学习计划", false, true],
  ["未来原创 JLPT 模拟考试", false, true]
];

export default function LandingPage() {
  return (
    <>
      <Section className="pb-10 pt-10 sm:pt-14 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-7">
            <Badge variant="outline" className="w-fit">
              N5～N1 综合日语学习平台
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                用现代产品体验，系统学习日语。
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                JAPANWEB 将单词、语法、阅读、练习和 JLPT 风格原创训练放进一条清晰学习路径，适合从 N5 起步到 N1 冲刺。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/dashboard" size="lg" trailingIcon={<ArrowRight className="h-4 w-4" />}>
                进入学习首页
              </Button>
              <Button href="/register" variant="outline" size="lg">
                免费注册
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-soft sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Today</p>
                <h2 className="text-lg font-semibold">今日学习</h2>
              </div>
              <Badge variant="success">连续 18 天</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">学习进度</p>
                <p className="mt-1 text-2xl font-semibold">68%</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">今日完成</p>
                <p className="mt-1 text-2xl font-semibold">24m</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">JLPT 目标</p>
                <p className="mt-1 text-2xl font-semibold">N2</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <Progress value={68} label="本周目标" />
              <div className="grid gap-3">
                {["N3 语法：〜ようにする", "N3 高频词复习", "N4 阅读：便利店文化"].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-3">
                    <span className="text-sm">{item}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="border-y border-border bg-muted/35">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {landingHighlights.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Modules</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">从内容到训练的完整闭环</h2>
          </div>
          <Button href="/dashboard" variant="outline" trailingIcon={<ArrowRight className="h-4 w-4" />}>
            快速开始
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.title}>
              <CardContent className="flex items-start justify-between gap-4 p-4 sm:p-5">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold">{module.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{module.detail}</p>
                </div>
                <Button href={module.href} variant="ghost" size="icon" aria-label={`打开${module.title}`}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-3">
            <Badge variant="accent" className="w-fit">
              FREE / PRO
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight">第一阶段先打通免费体验和会员权限框架</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              暂不接入真实支付和 AI。先让内容、练习、学习记录和会员锁定体验稳定起来。
            </p>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-[1fr_72px_72px] border-b border-border px-4 py-3 text-sm font-medium sm:px-5">
                <span>权益</span>
                <span className="text-center">FREE</span>
                <span className="text-center">PRO</span>
              </div>
              {planRows.map(([label, free, pro]) => (
                <div key={String(label)} className="grid grid-cols-[1fr_72px_72px] border-b border-border px-4 py-3 text-sm last:border-b-0 sm:px-5">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="flex justify-center">{free ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="text-muted-foreground">-</span>}</span>
                  <span className="flex justify-center">{pro ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="text-muted-foreground">-</span>}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section className="border-t border-border bg-muted/35">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Trophy className="h-4 w-4" />
              JLPT 风格原创内容
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">避免官方真题版权风险，商业内容以原创模拟题为主。</h2>
          </div>
          <Button href="/jlpt" variant="outline" leadingIcon={<ChartNoAxesColumnIncreasing className="h-4 w-4" />}>
            查看 JLPT 模块
          </Button>
        </div>
      </Section>
    </>
  );
}
