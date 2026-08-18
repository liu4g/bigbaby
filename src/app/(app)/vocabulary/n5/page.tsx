import type { Metadata } from "next";
import { VocabularyListPage } from "@/app/(app)/vocabulary/vocabulary-list-page";

export const metadata: Metadata = {
  title: "N5 单词",
  description: "学习 JLPT N5 基础日语单词。"
};

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <VocabularyListPage fixedLevel="N5" searchParams={searchParams} />;
}
