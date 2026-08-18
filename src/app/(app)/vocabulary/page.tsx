import { VocabularyListPage, vocabularyMetadata } from "@/app/(app)/vocabulary/vocabulary-list-page";

export const metadata = vocabularyMetadata;

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <VocabularyListPage searchParams={searchParams} />;
}
