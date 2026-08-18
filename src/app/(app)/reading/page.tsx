import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { ContentCard } from "@/components/content/content-card";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { buildLevelFilterItems, normalizeLevelFilter } from "@/lib/site";
import { readingArticles } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "文章",
  description: "阅读 N5～N1 分级文章，积累词汇和语法语境。"
};

export default async function ReadingPage({
  searchParams
}: {
  searchParams?: Promise<{ level?: string | string[] }>;
}) {
  const params = await searchParams;
  const activeLevel = normalizeLevelFilter(params?.level);
  const items = activeLevel === "all" ? readingArticles : readingArticles.filter((item) => item.level === activeLevel);

  return (
    <Section>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Reading"
          title="文章"
          description="阅读页先展示文章卡片、阅读时间、词数、会员锁定和进度。"
        />
        <SegmentedControl items={buildLevelFilterItems("/reading", activeLevel)} />

        {items.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <ContentCard
                key={item.title}
                href="/reading"
                title={item.title}
                description={item.summary}
                level={item.level}
                meta={[item.readTime, item.words, "重点词汇"]}
                progress={item.progress}
                locked={item.locked}
                icon={<Newspaper className="h-5 w-5" />}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="这个等级暂时没有文章"
            description="当前 mock 数据没有匹配项，后续可用原创文章和 AI 分析能力扩展。"
            actionLabel="查看全部文章"
            actionHref="/reading"
            icon={<Newspaper className="h-5 w-5" />}
          />
        )}
      </div>
    </Section>
  );
}
