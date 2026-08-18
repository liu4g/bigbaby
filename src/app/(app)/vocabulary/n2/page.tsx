import type { Metadata } from "next";
import { VocabularyListPage } from "@/app/(app)/vocabulary/vocabulary-list-page";

export const metadata: Metadata = {
  title: "N2 单词",
  description: "学习 JLPT N2 高级日语单词。N2 内容需要 PRO 权限。"
};

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <VocabularyListPage fixedLevel="N2" searchParams={searchParams} />;
}
