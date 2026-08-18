import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isAuthPreviewEnabled } from "@/lib/auth";
import { isLevel, levels, type Level, type LevelFilter } from "@/lib/site";
import {
  canAccessContent,
  getAccountTier as getAccountTierFromAccessControl,
  normalizePreviewPlan as normalizePreviewPlanFromAccessControl,
  type AccountTier
} from "@/lib/access-control";
export type { AccountTier } from "@/lib/access-control";
import {
  buildVocabularyQuizChoices,
  getVocabularyCategoryLabel,
  vocabularyCategories,
  vocabularyEntries,
  type AccessTier,
  type VocabularyEntry,
  type VocabularyExample,
  type VocabularyProgressStatus,
  type VocabularyWithState
} from "@/lib/vocabulary-data";

export type VocabularySearchInput = {
  level?: LevelFilter;
  query?: string;
  category?: string;
  previewPlan?: AccountTier;
};

export type VocabularyListResult = {
  items: VocabularyWithState[];
  accountTier: AccountTier;
  isPreview: boolean;
  activeLevel: LevelFilter;
  query: string;
  category: string;
  stats: {
    total: number;
    mastered: number;
    unfamiliar: number;
    review: number;
    bookmarked: number;
  };
};

export type VocabularyDetailResult = {
  item: VocabularyWithState | null;
  accountTier: AccountTier;
  isPreview: boolean;
  isLocked: boolean;
  quizChoices: string[];
};

export type PreviewVocabularyState = Record<
  string,
  {
    bookmarked?: boolean;
    status?: VocabularyProgressStatus;
    masteryScore?: number;
    nextReviewAt?: string | null;
  }
>;

const previewStateCookieName = "japanweb_vocab_state";

const defaultPreviewState: PreviewVocabularyState = {
  "00000000-0000-0000-0000-000000000101": {
    bookmarked: false,
    status: "completed",
    masteryScore: 92,
    nextReviewAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  "00000000-0000-0000-0000-000000000103": {
    bookmarked: true,
    status: "in_progress",
    masteryScore: 58,
    nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  "00000000-0000-0000-0000-000000000105": {
    bookmarked: false,
    status: "in_progress",
    masteryScore: 71,
    nextReviewAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
  }
};

type VocabularyRow = {
  id: string;
  slug: string;
  level: Level;
  word: string;
  kana: string;
  reading: string | null;
  romaji: string | null;
  meaning: string;
  part_of_speech: string | null;
  notes: string | null;
  access_tier: AccessTier;
  pitch_accent: string | null;
  category: string | null;
  synonyms: string[] | null;
  antonyms: string[] | null;
  vocabulary_examples?: Array<{
    example_order: number;
    japanese_text: string;
    translation: string;
    notes: string | null;
  }>;
};

type UserVocabularyRow = {
  vocabulary_id: string;
  status: VocabularyProgressStatus;
  mastery_score: number;
  next_review_at: string | null;
};

type BookmarkRow = {
  vocabulary_id: string;
};

const partOfSpeechLabels: Record<string, string> = {
  noun: "名词",
  verb: "动词",
  adjective: "形容词",
  adverb: "副词",
  expression: "表达"
};

export function normalizeVocabularyLevel(value: string | string[] | undefined): LevelFilter {
  const candidate = Array.isArray(value) ? value[0] : value;

  return isLevel(candidate) ? candidate : "all";
}

export function normalizeVocabularyQuery(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  return typeof candidate === "string" ? candidate.trim().replace(/\s+/g, " ").slice(0, 80) : "";
}

export function normalizeVocabularyCategory(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || candidate === "all") {
    return "all";
  }

  return vocabularyCategories.some((item) => item.id === candidate) ? candidate : "all";
}

export function normalizePreviewPlan(value: string | string[] | undefined): AccountTier | undefined {
  return normalizePreviewPlanFromAccessControl(value);
}

export function canAccessVocabulary(entry: Pick<VocabularyEntry, "accessTier" | "jlptLevel">, accountTier: AccountTier) {
  return canAccessContent(accountTier, entry.jlptLevel, entry.accessTier);
}

export function isProLevel(level: LevelFilter) {
  return level === "N2" || level === "N1";
}

export function getVocabularyLevelHref(level: LevelFilter, options?: { query?: string; category?: string; plan?: AccountTier }) {
  const pathname = level === "all" ? "/vocabulary" : `/vocabulary/${level.toLowerCase()}`;
  const params = new URLSearchParams();

  if (options?.query) {
    params.set("q", options.query);
  }

  if (options?.category && options.category !== "all") {
    params.set("category", options.category);
  }

  if (options?.plan && isAuthPreviewEnabled()) {
    params.set("plan", options.plan);
  }

  const search = params.toString();

  return search ? `${pathname}?${search}` : pathname;
}

export async function readPreviewVocabularyState() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(previewStateCookieName)?.value;

  if (!raw) {
    return defaultPreviewState;
  }

  try {
    return { ...defaultPreviewState, ...(JSON.parse(raw) as PreviewVocabularyState) };
  } catch {
    return defaultPreviewState;
  }
}

export async function writePreviewVocabularyState(state: PreviewVocabularyState) {
  const cookieStore = await cookies();

  cookieStore.set(previewStateCookieName, JSON.stringify(state), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax"
  });
}

export async function getAccountTier(
  supabase: SupabaseClient | null,
  user: User,
  previewPlan?: AccountTier
): Promise<AccountTier> {
  return getAccountTierFromAccessControl(supabase, user, previewPlan);
}

export async function getVocabularyList(
  supabase: SupabaseClient | null,
  user: User,
  input: VocabularySearchInput
): Promise<VocabularyListResult> {
  const accountTier = await getAccountTier(supabase, user, input.previewPlan);
  const activeLevel = input.level ?? "all";
  const query = input.query ?? "";
  const category = input.category ?? "all";
  const isPreview = !supabase || isAuthPreviewEnabled();

  if (isPreview) {
    const previewState = await readPreviewVocabularyState();
    const items = vocabularyEntries
      .filter((entry) => activeLevel === "all" || entry.jlptLevel === activeLevel)
      .filter((entry) => category === "all" || entry.category === category)
      .filter((entry) => matchesVocabularyQuery(entry, query))
      .map((entry) => mergeVocabularyState(entry, previewState, accountTier));

    return {
      items,
      accountTier,
      isPreview,
      activeLevel,
      query,
      category,
      stats: buildStats(items)
    };
  }

  let dbQuery = supabase
    .from("vocabulary")
    .select(
      "id,slug,level,word,kana,reading,romaji,meaning,part_of_speech,notes,access_tier,pitch_accent,category,synonyms,antonyms,vocabulary_examples(example_order,japanese_text,translation,notes)"
    )
    .eq("status", "published");

  if (activeLevel !== "all") {
    dbQuery = dbQuery.eq("level", activeLevel);
  }

  if (category !== "all") {
    dbQuery = dbQuery.eq("category", category);
  }

  const safeTerm = query.replace(/[%,()]/g, " ").trim();

  if (safeTerm) {
    const pattern = `%${safeTerm}%`;
    dbQuery = dbQuery.or(
      `word.ilike.${pattern},kana.ilike.${pattern},reading.ilike.${pattern},meaning.ilike.${pattern},part_of_speech.ilike.${pattern},category.ilike.${pattern}`
    );
  }

  const { data, error } = await dbQuery.order("level", { ascending: true }).order("word", { ascending: true });

  if (error) {
    console.error("Vocabulary list query failed", error);

    return {
      items: [],
      accountTier,
      isPreview,
      activeLevel,
      query,
      category,
      stats: buildStats([])
    };
  }

  const rows = (data ?? []) as VocabularyRow[];
  const ids = rows.map((row) => row.id);
  const [progressRows, bookmarkRows] = await Promise.all([
    getUserVocabularyRows(supabase, user.id, ids),
    getVocabularyBookmarkRows(supabase, user.id, ids)
  ]);
  const progressMap = new Map(progressRows.map((row) => [row.vocabulary_id, row]));
  const bookmarkSet = new Set(bookmarkRows.map((row) => row.vocabulary_id));
  const items = rows.map((row) => mergeDatabaseState(mapVocabularyRow(row), progressMap, bookmarkSet));

  return {
    items,
    accountTier,
    isPreview,
    activeLevel,
    query,
    category,
    stats: buildStats(items)
  };
}

export async function getVocabularyDetail(
  supabase: SupabaseClient | null,
  user: User,
  slug: string,
  previewPlan?: AccountTier
): Promise<VocabularyDetailResult> {
  const accountTier = await getAccountTier(supabase, user, previewPlan);
  const isPreview = !supabase || isAuthPreviewEnabled();

  if (isPreview) {
    const previewState = await readPreviewVocabularyState();
    const entry = vocabularyEntries.find((item) => item.slug === slug);

    if (!entry) {
      return { item: null, accountTier, isPreview, isLocked: false, quizChoices: [] };
    }

    const item = mergeVocabularyState(entry, previewState, accountTier);

    return {
      item,
      accountTier,
      isPreview,
      isLocked: item.isLocked,
      quizChoices: item.canAccess ? buildVocabularyQuizChoices(item) : []
    };
  }

  const { data, error } = await supabase
    .from("vocabulary")
    .select(
      "id,slug,level,word,kana,reading,romaji,meaning,part_of_speech,notes,access_tier,pitch_accent,category,synonyms,antonyms,vocabulary_examples(example_order,japanese_text,translation,notes)"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Vocabulary detail query failed", error);
  }

  if (!data) {
    return {
      item: null,
      accountTier,
      isPreview,
      isLocked: accountTier === "free" && /^n[12]-/.test(slug),
      quizChoices: []
    };
  }

  const row = data as VocabularyRow;
  const [progressRows, bookmarkRows] = await Promise.all([
    getUserVocabularyRows(supabase, user.id, [row.id]),
    getVocabularyBookmarkRows(supabase, user.id, [row.id])
  ]);
  const item = mergeDatabaseState(mapVocabularyRow(row), new Map(progressRows.map((item) => [item.vocabulary_id, item])), new Set(bookmarkRows.map((item) => item.vocabulary_id)));

  return {
    item,
    accountTier,
    isPreview,
    isLocked: false,
    quizChoices: buildVocabularyQuizChoices(item)
  };
}

async function getUserVocabularyRows(supabase: SupabaseClient, userId: string, vocabularyIds: string[]) {
  if (vocabularyIds.length === 0) {
    return [] as UserVocabularyRow[];
  }

  const { data, error } = await supabase
    .from("user_vocabulary")
    .select("vocabulary_id,status,mastery_score,next_review_at")
    .eq("user_id", userId)
    .in("vocabulary_id", vocabularyIds);

  if (error) {
    console.error("User vocabulary query failed", error);
    return [] as UserVocabularyRow[];
  }

  return (data ?? []) as UserVocabularyRow[];
}

async function getVocabularyBookmarkRows(supabase: SupabaseClient, userId: string, vocabularyIds: string[]) {
  if (vocabularyIds.length === 0) {
    return [] as BookmarkRow[];
  }

  const { data, error } = await supabase
    .from("user_bookmarks")
    .select("vocabulary_id")
    .eq("user_id", userId)
    .eq("content_type", "vocabulary")
    .in("vocabulary_id", vocabularyIds);

  if (error) {
    console.error("Vocabulary bookmarks query failed", error);
    return [] as BookmarkRow[];
  }

  return (data ?? []) as BookmarkRow[];
}

function matchesVocabularyQuery(entry: VocabularyEntry, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    entry.word,
    entry.reading,
    entry.kana,
    entry.romaji,
    entry.meaning,
    entry.partOfSpeechLabel,
    entry.categoryLabel,
    entry.synonyms.join(" "),
    entry.antonyms.join(" ")
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function mergeVocabularyState(
  entry: VocabularyEntry,
  previewState: PreviewVocabularyState,
  accountTier: AccountTier
): VocabularyWithState {
  const canAccess = canAccessVocabulary(entry, accountTier);
  const state = canAccess ? (previewState[entry.id] ?? {}) : {};
  const visibleEntry = canAccess
    ? entry
    : {
        ...entry,
        romaji: "",
        meaning: "PRO 解锁后查看",
        notes: "",
        examples: [],
        synonyms: [],
        antonyms: []
      };

  return {
    ...visibleEntry,
    canAccess,
    isLocked: !canAccess,
    isBookmarked: Boolean(state.bookmarked),
    status: state.status ?? "not_started",
    masteryScore: state.masteryScore ?? 0,
    nextReviewAt: state.nextReviewAt ?? null
  };
}

function mergeDatabaseState(
  entry: VocabularyEntry,
  progressMap: Map<string, UserVocabularyRow>,
  bookmarkSet: Set<string>
): VocabularyWithState {
  const progress = progressMap.get(entry.id);

  return {
    ...entry,
    canAccess: true,
    isLocked: false,
    isBookmarked: bookmarkSet.has(entry.id),
    status: progress?.status ?? "not_started",
    masteryScore: Number(progress?.mastery_score ?? 0),
    nextReviewAt: progress?.next_review_at ?? null
  };
}

function mapVocabularyRow(row: VocabularyRow): VocabularyEntry {
  const partOfSpeech = row.part_of_speech ?? "expression";
  const category = row.category ?? "expressions";
  const examples: VocabularyExample[] = [...(row.vocabulary_examples ?? [])]
    .sort((a, b) => a.example_order - b.example_order)
    .map((example) => ({
      japanese: example.japanese_text,
      reading: "",
      meaning: example.translation,
      note: example.notes ?? undefined
    }));

  return {
    id: row.id,
    slug: row.slug,
    word: row.word,
    reading: row.reading || row.kana,
    kana: row.kana,
    romaji: row.romaji ?? "",
    meaning: row.meaning,
    partOfSpeech,
    partOfSpeechLabel: partOfSpeechLabels[partOfSpeech] ?? partOfSpeech,
    jlptLevel: row.level,
    pitchAccent: row.pitch_accent ?? "未设置",
    category,
    categoryLabel: getVocabularyCategoryLabel(category),
    notes: row.notes ?? "",
    accessTier: row.access_tier,
    examples,
    synonyms: row.synonyms ?? [],
    antonyms: row.antonyms ?? []
  };
}

function buildStats(items: VocabularyWithState[]): VocabularyListResult["stats"] {
  return {
    total: items.length,
    mastered: items.filter((item) => item.status === "completed").length,
    unfamiliar: items.filter((item) => item.status === "in_progress").length,
    review: items.filter((item) => item.nextReviewAt).length,
    bookmarked: items.filter((item) => item.isBookmarked).length
  };
}

export function allVocabularyLevels() {
  return levels;
}
