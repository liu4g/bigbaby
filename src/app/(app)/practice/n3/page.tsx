import type { Metadata } from "next";
import { PracticeListPage } from "@/app/(app)/practice/practice-list-page";

export const metadata: Metadata = {
  title: "N3 练习",
  description: "练习 JLPT N3 语法辨析、填空和综合题。"
};

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PracticeListPage fixedLevel="N3" searchParams={searchParams} />;
}
