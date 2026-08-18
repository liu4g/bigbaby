import type { Metadata } from "next";
import { promises as fs } from "node:fs";
import path from "node:path";
import { BookOpenCheck, CheckCircle2, FileSearch, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "词典融合预览",
  description: "查看 GoldenDict 多词典参考融合后的单词候选效果。"
};

type FusionCandidate = {
  word: string;
  recommended: {
    reading: string | null;
    pitchAccent: string[];
    partOfSpeech: string[];
    meaning: string;
  };
  evidence: {
    sourceHits: Array<{
      sourceId: string;
      matchedKey: string | null;
      linkedKey: string | null;
      readingCandidates: string[];
      pitchAccentCandidates: string[];
      partOfSpeechCandidates: string[];
    }>;
  };
  originalExampleDraft: {
    japanese: string;
    reading: string;
    meaning: string;
  };
  confidenceScore: number;
  reviewNotes: string[];
};

type FusionPreview = {
  generatedAt: string;
  copyrightNote: string;
  candidates: FusionCandidate[];
};

export default async function Page() {
  const preview = await readFusionPreview();

  return (
    <Section>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Dictionary Import"
          title="词典融合预览"
          description="从多本词典中提取读音、音调、词性等参考信号，再生成原创释义和原创例句草稿。这里不展示词典原文。"
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant="muted">Internal Preview</Badge>
              <Badge variant="outline">不直接发布原文</Badge>
            </div>
          }
        />

        {!preview ? (
          <EmptyState
            title="还没有融合预览"
            description="先运行 npm.cmd run dictionary:lookup 和 npm.cmd run dictionary:fuse 生成预览数据。"
            icon={<FileSearch className="h-5 w-5" />}
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard label="候选词条" value={preview.candidates.length.toString()} />
              <SummaryCard
                label="平均置信度"
                value={`${Math.round(
                  preview.candidates.reduce((total, item) => total + item.confidenceScore, 0) / preview.candidates.length
                )}%`}
              />
              <SummaryCard label="生成时间" value={new Date(preview.generatedAt).toLocaleString("zh-CN")} />
            </div>

            <Card className="border-dashed">
              <CardContent className="flex gap-3 p-4 text-sm leading-6 text-muted-foreground">
                <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>{preview.copyrightNote}</p>
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
              {preview.candidates.map((candidate) => (
                <CandidateCard key={candidate.word} candidate={candidate} />
              ))}
            </div>
          </>
        )}
      </div>
    </Section>
  );
}

async function readFusionPreview() {
  try {
    const filePath = path.join(process.cwd(), "artifacts", "dictionary-import", "fusion-preview.json");
    const raw = await fs.readFile(filePath, "utf8");

    return JSON.parse(raw) as FusionPreview;
  } catch {
    return null;
  }
}

function CandidateCard({ candidate }: { candidate: FusionCandidate }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">候选</Badge>
              {candidate.recommended.partOfSpeech.map((item) => (
                <Badge key={item} variant="muted">
                  {formatPartOfSpeech(item)}
                </Badge>
              ))}
            </div>
            <div>
              <CardTitle className="text-2xl">{candidate.word}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{candidate.recommended.reading ?? "读音待确认"}</p>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpenCheck className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoCell label="释义草稿" value={candidate.recommended.meaning || "待补充"} />
          <InfoCell label="音调候选" value={candidate.recommended.pitchAccent.join(" / ") || "待确认"} />
          <InfoCell label="来源命中" value={`${candidate.evidence.sourceHits.length} 本`} />
        </div>

        <Progress value={candidate.confidenceScore} label="融合置信度" />

        <div className="rounded-lg bg-muted p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">原创例句草稿</p>
          </div>
          <p className="text-base font-medium">{candidate.originalExampleDraft.japanese}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{candidate.originalExampleDraft.reading}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{candidate.originalExampleDraft.meaning}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">参考来源</p>
          <div className="grid gap-2">
            {candidate.evidence.sourceHits.map((source) => (
              <div key={source.sourceId} className="rounded-lg border border-border bg-background p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{source.sourceId}</Badge>
                  {source.matchedKey ? <Badge variant="muted">匹配：{source.matchedKey}</Badge> : null}
                  {source.linkedKey ? <Badge variant="muted">链接：{source.linkedKey}</Badge> : null}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  读音候选：{source.readingCandidates.join(" / ") || "无"}；音调候选：
                  {source.pitchAccentCandidates.join(" / ") || "无"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function formatPartOfSpeech(value: string) {
  const labels: Record<string, string> = {
    noun: "名词",
    verb: "动词",
    suru_verb: "サ变",
    i_adjective: "い形容词",
    na_adjective: "な形容词"
  };

  return labels[value] ?? value;
}
