import type { Metadata } from "next";
import { PracticeListPage } from "@/app/(app)/practice/practice-list-page";

export const metadata: Metadata = {
  title: "N4 练习",
  description: "练习 JLPT N4 综合基础题，覆盖单词、语法和阅读理解。"
};

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PracticeListPage fixedLevel="N4" searchParams={searchParams} />;
}
