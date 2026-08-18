import { PracticeListPage, practiceMetadata } from "@/app/(app)/practice/practice-list-page";

export const metadata = practiceMetadata;

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PracticeListPage searchParams={searchParams} />;
}
