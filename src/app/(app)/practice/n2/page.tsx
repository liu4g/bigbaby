import type { Metadata } from "next";
import { PracticeListPage } from "@/app/(app)/practice/practice-list-page";

export const metadata: Metadata = {
  title: "N2 练习",
  description: "练习 JLPT N2 高级阅读和语法题，PRO 用户可访问。"
};

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PracticeListPage fixedLevel="N2" searchParams={searchParams} />;
}
