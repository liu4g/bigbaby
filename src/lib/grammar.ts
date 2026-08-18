import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isAuthPreviewEnabled } from "@/lib/auth";
import { isLevel, levels, type Level, type LevelFilter } from "@/lib/site";
import { canAccessContent, getAccountTier, normalizePreviewPlan, type AccountTier } from "@/lib/access-control";
import {
  grammarEntries,
  type GrammarEntry,
  type GrammarExample,
  type GrammarProgressStatus,
  type GrammarWithState
} from "@/lib/grammar-data";

export type GrammarSearchInput = {
  level?: LevelFilter;
  query?: string;
  previewPlan?: AccountTier;
};

export type GrammarListResult = {
  items: GrammarWithState[];
  accountTier: AccountTier;
  isPreview: boolean;
  activeLevel: LevelFilter;
  query: string;
  stats: {
    total: number;
    mastered: number;
    unfamiliar: number;
    review: number;
    bookmarked: number;
  };
};

export type GrammarDetailResult = {
  item: GrammarWithState | null;
  accountTier: AccountTier;
  isPreview: boolean;
  isLocked: boolean;
  practiceChoices: string[];
};

export type PreviewGrammarState = Record<
  string,
  {
    bookmarked?: boolean;
    status?: GrammarProgressStatus;
    masteryScore?: number;
    nextReviewAt?: string | null;
  }
>;

const previewStateCookieName = "japanweb_grammar_state";

const defaultPreviewState: PreviewGrammarState = {
  "00000000-0000-0000-0000-000000000201": {
    bookmarked: true,
    status: "completed",
    masteryScore: 88,
    nextReviewAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  "00000000-0000-0000-0000-000000000202": {
    bookmarked: false,
    status: "in_progress",
    masteryScore: 64,
    nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  "00000000-0000-0000-0000-000000000204": {
    bookmarked: false,
    status: "in_progress",
    masteryScore: 42,
    nextReviewAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
  }
};

type GrammarRow = {
  id: string;
  slug: string;
  level: Level;
  title: string;
  pattern: string;
  meaning: string;
  usage_notes: string | null;
  notes: string | null;
  access_tier: "free" | "pro";
  similar_grammar: string[] | null;
  grammar_examples?: Array<{
    example_order: number;
    japanese_text: string;
    translation: string;
    notes: string | null;
  }>;
};

type UserGrammarRow = {
  grammar_id: string;
  status: GrammarProgressStatus;
  mastery_score: number;
  next_review_at: string | null;
};

export function normalizeGrammarLevel(value: string | string[] | undefined): LevelFilter {
  const candidate = Array.isArray(value) ? value[0] : value;

  return isLevel(candidate) ? candidate : "all";
}

export function normalizeGrammarQuery(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  return typeof candidate === "string" ? candidate.trim().replace(/\s+/g, " ").slice(0, 80) : "";
}

export function canAccessGrammar(entry: Pick<GrammarEntry, "accessTier" | "jlptLevel">, accountTier: AccountTier) {
  return canAccessContent(accountTier, entry.jlptLevel, entry.accessTier);
}

export function isProGrammarLevel(level: LevelFilter) {
  return level === "N2" || level === "N1";
}

export function getGrammarLevelHref(level: LevelFilter, options?: { query?: string; plan?: AccountTier }) {
  const pathname = level === "all" ? "/grammar" : `/grammar/${level.toLowerCase()}`;
  const params = new URLSearchParams();

  if (options?.query) {
    params.set("q", options.query);
  }

  if (options?.plan && isAuthPreviewEnabled()) {
    params.set("plan", options.plan);
  }

  const search = params.toString();

  return search ? `${pathname}?${search}` : pathname;
}

export async function readPreviewGrammarState() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(previewStateCookieName)?.value;

  if (!raw) {
    return defaultPreviewState;
  }

  try {
    return { ...defaultPreviewState, ...(JSON.parse(raw) as PreviewGrammarState) };
  } catch {
    return defaultPreviewState;
  }
}

export async function writePreviewGrammarState(state: PreviewGrammarState) {
  const cookieStore = await cookies();

  cookieStore.set(previewStateCookieName, JSON.stringify(state), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax"
  });
}

export async function getGrammarList(
  supabase: SupabaseClient | null,
  user: User,
  input: GrammarSearchInput
): Promise<GrammarListResult> {
  const accountTier = await getAccountTier(supabase, user, input.previewPlan);
  const activeLevel = input.level ?? "all";
  const query = input.query ?? "";
  const isPreview = !supabase || isAuthPreviewEnabled();

  if (isPreview) {
    const previewState = await readPreviewGrammarState();
    const items = grammarEntries
      .filter((entry) => activeLevel === "all" || entry.jlptLevel === activeLevel)
      .filter((entry) => matchesGrammarQuery(entry, query))
      .map((entry) => mergeGrammarState(entry, previewState, accountTier));

    return {
      items,
      accountTier,
      isPreview,
      activeLevel,
      query,
      stats: buildStats(items)
    };
  }

  let dbQuery = supabase
    .from("grammar")
    .select(
      "id,slug,level,title,pattern,meaning,usage_notes,notes,access_tier,similar_grammar,grammar_examples(example_order,japanese_text,translation,notes)"
    )
    .eq("status", "published");

  if (activeLevel !== "all") {
    dbQuery = dbQuery.eq("level", activeLevel);
  }

  const safeTerm = query.replace(/[%,()]/g, " ").trim();

  if (safeTerm) {
    const pattern = `%${safeTerm}%`;
    dbQuery = dbQuery.or(
      `title.ilike.${pattern},pattern.ilike.${pattern},meaning.ilike.${pattern},usage_notes.ilike.${pattern},notes.ilike.${pattern}`
    );
  }

  const { data, error } = await dbQuery.order("level", { ascending: true }).order("title", { ascending: true });

  if (error) {
    console.error("Grammar list query failed", error);

    return {
      items: [],
      accountTier,
      isPreview,
      activeLevel,
      query,
      stats: buildStats([])
    };
  }

  const rows = (data ?? []) as GrammarRow[];
  const ids = rows.map((row) => row.id);
  const [progressRows, bookmarkRows] = await Promise.all([
    getUserGrammarRows(supabase, user.id, ids),
    getGrammarBookmarkRows(supabase, user.id, ids)
  ]);
  const progressMap = new Map(progressRows.map((row) => [row.grammar_id, row]));
  const bookmarkSet = new Set(bookmarkRows.map((row) => row.grammar_id));
  const items = rows.map((row) => mergeDatabaseState(mapGrammarRow(row), progressMap, bookmarkSet));

  return {
    items,
    accountTier,
    isPreview,
    activeLevel,
    query,
    stats: buildStats(items)
  };
}

export async function getGrammarDetail(
  supabase: SupabaseClient | null,
  user: User,
  slug: string,
  previewPlan?: AccountTier
): Promise<GrammarDetailResult> {
  const accountTier = await getAccountTier(supabase, user, previewPlan);
  const isPreview = !supabase || isAuthPreviewEnabled();

  if (isPreview) {
    const previewState = await readPreviewGrammarState();
    const entry = grammarEntries.find((item) => item.slug === slug);

    if (!entry) {
      return { item: null, accountTier, isPreview, isLocked: false, practiceChoices: [] };
    }

    const item = mergeGrammarState(entry, previewState, accountTier);

    return {
      item,
      accountTier,
      isPreview,
      isLocked: item.isLocked,
      practiceChoices: item.canAccess ? buildPracticeChoices(item) : []
    };
  }

  const { data, error } = await supabase
    .from("grammar")
    .select(
      "id,slug,level,title,pattern,meaning,usage_notes,notes,access_tier,similar_grammar,grammar_examples(example_order,japanese_text,translation,notes)"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Grammar detail query failed", error);
  }

  if (!data) {
    return {
      item: null,
      accountTier,
      isPreview,
      isLocked: accountTier === "free" && /^n[12]-/.test(slug),
      practiceChoices: []
    };
  }

  const row = data as GrammarRow;
  const [progressRows, bookmarkRows] = await Promise.all([
    getUserGrammarRows(supabase, user.id, [row.id]),
    getGrammarBookmarkRows(supabase, user.id, [row.id])
  ]);
  const item = mergeDatabaseState(
    mapGrammarRow(row),
    new Map(progressRows.map((entry) => [entry.grammar_id, entry])),
    new Set(bookmarkRows.map((entry) => entry.grammar_id))
  );

  return {
    item,
    accountTier,
    isPreview,
    isLocked: false,
    practiceChoices: buildPracticeChoices(item)
  };
}

function matchesGrammarQuery(entry: GrammarEntry, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    entry.grammarPoint,
    entry.formation,
    entry.meaning,
    entry.explanation,
    entry.notes,
    entry.similarGrammar.join(" ")
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function mergeGrammarState(
  entry: GrammarEntry,
  previewState: PreviewGrammarState,
  accountTier: AccountTier
): GrammarWithState {
  const canAccess = canAccessGrammar(entry, accountTier);
  const state = canAccess ? (previewState[entry.id] ?? {}) : {};
  const visibleEntry = canAccess
    ? entry
    : {
        ...entry,
        meaning: "PRO 解锁后查看",
        explanation: "",
        examples: [],
        similarGrammar: [],
        notes: ""
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
  entry: GrammarEntry,
  progressMap: Map<string, UserGrammarRow>,
  bookmarkSet: Set<string>
): GrammarWithState {
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

function mapGrammarRow(row: GrammarRow): GrammarEntry {
  const examples: GrammarExample[] = [...(row.grammar_examples ?? [])]
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
    grammarPoint: row.title,
    jlptLevel: row.level,
    meaning: row.meaning,
    formation: row.pattern,
    explanation: row.usage_notes ?? "",
    examples,
    similarGrammar: row.similar_grammar ?? [],
    notes: row.notes ?? "",
    accessTier: row.access_tier
  };
}

async function getUserGrammarRows(supabase: SupabaseClient, userId: string, grammarIds: string[]) {
  if (grammarIds.length === 0) {
    return [] as UserGrammarRow[];
  }

  const { data, error } = await supabase
    .from("user_grammar")
    .select("grammar_id,status,mastery_score,next_review_at")
    .eq("user_id", userId)
    .in("grammar_id", grammarIds);

  if (error) {
    console.error("User grammar query failed", error);
    return [] as UserGrammarRow[];
  }

  return (data ?? []) as UserGrammarRow[];
}

async function getGrammarBookmarkRows(supabase: SupabaseClient, userId: string, grammarIds: string[]) {
  if (grammarIds.length === 0) {
    return [] as Array<{ grammar_id: string }>;
  }

  const { data, error } = await supabase
    .from("user_bookmarks")
    .select("grammar_id")
    .eq("user_id", userId)
    .eq("content_type", "grammar")
    .in("grammar_id", grammarIds);

  if (error) {
    console.error("Grammar bookmarks query failed", error);
    return [] as Array<{ grammar_id: string }>;
  }

  return (data ?? []) as Array<{ grammar_id: string }>;
}

function buildStats(items: GrammarWithState[]): GrammarListResult["stats"] {
  return {
    total: items.length,
    mastered: items.filter((item) => item.status === "completed").length,
    unfamiliar: items.filter((item) => item.status === "in_progress").length,
    review: items.filter((item) => item.nextReviewAt).length,
    bookmarked: items.filter((item) => item.isBookmarked).length
  };
}

function buildPracticeChoices(entry: Pick<GrammarEntry, "meaning" | "jlptLevel">) {
  const pool = grammarEntries
    .filter((item) => item.meaning !== entry.meaning && item.jlptLevel === entry.jlptLevel)
    .map((item) => item.meaning);
  const fallback = grammarEntries.filter((item) => item.meaning !== entry.meaning).map((item) => item.meaning);

  return Array.from(new Set([entry.meaning, ...pool, ...fallback])).slice(0, 4).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

export function allGrammarLevels() {
  return levels;
}

export { normalizePreviewPlan };
