import type { Metadata } from "next";
import { GrammarListPage } from "@/app/(app)/grammar/grammar-list-page";

export const metadata: Metadata = {
  title: "N5 语法",
  description: "学习 JLPT N5 基础日语语法。"
};

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <GrammarListPage fixedLevel="N5" searchParams={searchParams} />;
}
