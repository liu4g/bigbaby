import type { Metadata } from "next";
import { PracticeListPage } from "@/app/(app)/practice/practice-list-page";

export const metadata: Metadata = {
  title: "N1 练习",
  description: "练习 JLPT N1 原创高阶词汇、语法和专项题，PRO 用户可访问。"
};

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PracticeListPage fixedLevel="N1" searchParams={searchParams} />;
}
