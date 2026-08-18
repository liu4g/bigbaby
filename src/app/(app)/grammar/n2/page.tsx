import type { Metadata } from "next";
import { GrammarListPage } from "@/app/(app)/grammar/grammar-list-page";

export const metadata: Metadata = {
  title: "N2 语法",
  description: "学习 JLPT N2 高级日语语法。N2 内容需要 PRO 权限。"
};

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <GrammarListPage fixedLevel="N2" searchParams={searchParams} />;
}
