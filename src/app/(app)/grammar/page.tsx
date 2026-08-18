import { GrammarListPage, grammarMetadata } from "@/app/(app)/grammar/grammar-list-page";

export const metadata = grammarMetadata;

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <GrammarListPage searchParams={searchParams} />;
}
