import type { Metadata } from "next";
import { GrammarListPage } from "@/app/(app)/grammar/grammar-list-page";

export const metadata: Metadata = {
  title: "N1 语法",
  description: "学习 JLPT N1 高级日语语法。N1 内容需要 PRO 权限。"
};

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <GrammarListPage fixedLevel="N1" searchParams={searchParams} />;
}
