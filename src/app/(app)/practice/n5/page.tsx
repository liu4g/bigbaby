import type { Metadata } from "next";
import { PracticeListPage } from "@/app/(app)/practice/practice-list-page";

export const metadata: Metadata = {
  title: "N5 练习",
  description: "练习 JLPT N5 基础单词、语法和短句理解。"
};

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PracticeListPage fixedLevel="N5" searchParams={searchParams} />;
}
