import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isAuthPreviewEnabled } from "@/lib/auth";
import { isLevel, levels, type Level, type LevelFilter } from "@/lib/site";
import { canAccessContent, getAccountTier, normalizePreviewPlan, type AccountTier } from "@/lib/access-control";
import {
  practiceSets,
  type PracticeKind,
  type PracticeOption,
  type PracticePublicQuestion,
  type PracticePublicSet,
  type PracticeQuestion,
  type PracticeSetEntry,
  type PracticeSetWithState,
  type QuestionType
} from "@/lib/practice-data";

export type PracticeKindFilter = "all" | PracticeKind;

export type PracticeSearchInput = {
  level?: LevelFilter;
  kind?: PracticeKindFilter;
  query?: string;
  previewPlan?: AccountTier;
};

export type PracticeListResult = {
  items: PracticeSetWithState[];
  accountTier: AccountTier;
  isPreview: boolean;
  activeLevel: LevelFilter;
  activeKind: PracticeKindFilter;
  query: string;
  stats: {
    total: number;
    unlocked: number;
    questions: number;
    wrong: number;
    bestAccuracy: number;
  };
};

export type PracticeDetailResult = {
  set: PracticePublicSet | null;
  accountTier: AccountTier;
  isPreview: boolean;
  isLocked: boolean;
};

export type PracticeAnswerInput = {
  selectedOptionIds?: string[];
  text?: string;
};

export type PracticeAnswerMap = Record<string, PracticeAnswerInput>;

export type PracticeQuestionResult = {
  questionId: string;
  question: string;
  questionType: QuestionType;
  difficulty: number;
  isCorrect: boolean;
  selectedLabels: string[];
  selectedText: string;
  correctLabels: string[];
  correctTexts: string[];
  explanation: string;
  reviewSuggestion: string;
};

export type PracticeSubmissionResult = {
  practiceSetId?: string;
  practiceSetTitle: string;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
  recommendation: string;
  questions: PracticeQuestionResult[];
};

export type PracticeActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  result?: PracticeSubmissionResult;
};

export type PreviewPracticeState = Record<
  string,
  {
    bestAccuracy?: number;
    lastPracticedAt?: string | null;
  }
>;

export type PreviewWrongAnswerState = Record<
  string,
  {
    wrongCount: number;
    lastWrongAt: string;
    resolvedAt?: string | null;
    selectedOptionIds?: string[];
    selectedText?: string;
  }
>;

export type PracticeWrongAnswerItem = {
  questionId: string;
  question: string;
  questionType: QuestionType;
  practiceSetSlug: string;
  practiceSetTitle: string;
  jlptLevel: Level;
  kind: PracticeKind;
  wrongCount: number;
  lastWrongAt: string;
  notes?: string | null;
};

export const practiceKindFilters: PracticeKindFilter[] = ["all", "vocabulary", "grammar", "reading", "jlpt_mock", "mixed"];

const previewPracticeStateCookieName = "japanweb_practice_state";
const previewWrongAnswersCookieName = "japanweb_practice_wrong_answers";

const defaultPreviewPracticeState: PreviewPracticeState = {
  "00000000-0000-0000-0000-000000000401": {
    bestAccuracy: 83,
    lastPracticedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  "00000000-0000-0000-0000-000000000402": {
    bestAccuracy: 66,
    lastPracticedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
};

const defaultPreviewWrongAnswers: PreviewWrongAnswerState = {
  "00000000-0000-0000-0000-000000000508": {
    wrongCount: 2,
    lastWrongAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    selectedText: "ために"
  },
  "00000000-0000-0000-0000-000000000512": {
    wrongCount: 1,
    lastWrongAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    selectedOptionIds: ["00000000-0000-0000-0000-000000000633"]
  }
};

type PracticeSetRow = {
  id: string;
  slug: string;
  level: Level;
  title: string;
  description: string;
  kind: PracticeKind;
  is_jlpt_style: boolean;
  access_tier: "free" | "pro";
  questions?: QuestionRow[];
};

type QuestionRow = {
  id: string;
  sort_order: number;
  question_type: QuestionType;
  prompt: string;
  hint: string | null;
  explanation: string | null;
  difficulty: number;
  source_article_id?: string | null;
  source_vocabulary_id?: string | null;
  source_grammar_id?: string | null;
  question_options?: OptionRow[];
};

type OptionRow = {
  id: string;
  option_order: number;
  option_label: string;
  option_text: string;
  explanation: string | null;
};

type ProgressRow = {
  practice_set_id: string;
  mastery_score: number;
  last_studied_at: string | null;
};

type WrongAnswerRow = {
  question_id: string;
  wrong_count: number;
  last_wrong_at: string;
  resolved_at: string | null;
  notes: string | null;
};

export function normalizePracticeLevel(value: string | string[] | undefined): LevelFilter {
  const candidate = Array.isArray(value) ? value[0] : value;

  return isLevel(candidate) ? candidate : "all";
}

export function normalizePracticeKind(value: string | string[] | undefined): PracticeKindFilter {
  const candidate = Array.isArray(value) ? value[0] : value;

  return practiceKindFilters.includes(candidate as PracticeKindFilter) ? (candidate as PracticeKindFilter) : "all";
}

export function normalizePracticeQuery(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  return typeof candidate === "string" ? candidate.trim().replace(/\s+/g, " ").slice(0, 80) : "";
}

export function canAccessPracticeSet(entry: Pick<PracticeSetEntry, "accessTier" | "jlptLevel">, accountTier: AccountTier) {
  return canAccessContent(accountTier, entry.jlptLevel, entry.accessTier);
}

export function isProPracticeLevel(level: LevelFilter) {
  return level === "N2" || level === "N1";
}

export function getPracticeLevelHref(
  level: LevelFilter,
  options?: { query?: string; kind?: PracticeKindFilter; plan?: AccountTier }
) {
  const pathname = level === "all" ? "/practice" : `/practice/${level.toLowerCase()}`;
  const params = new URLSearchParams();

  if (options?.query) {
    params.set("q", options.query);
  }

  if (options?.kind && options.kind !== "all") {
    params.set("kind", options.kind);
  }

  if (options?.plan && isAuthPreviewEnabled()) {
    params.set("plan", options.plan);
  }

  const search = params.toString();

  return search ? `${pathname}?${search}` : pathname;
}

export function getPracticeSetHref(slug: string, plan?: AccountTier) {
  const params = new URLSearchParams();

  if (plan && isAuthPreviewEnabled()) {
    params.set("plan", plan);
  }

  const search = params.toString();

  return search ? `/practice/${slug}?${search}` : `/practice/${slug}`;
}

export async function readPreviewPracticeState() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(previewPracticeStateCookieName)?.value;

  if (!raw) {
    return defaultPreviewPracticeState;
  }

  try {
    return { ...defaultPreviewPracticeState, ...(JSON.parse(raw) as PreviewPracticeState) };
  } catch {
    return defaultPreviewPracticeState;
  }
}

export async function writePreviewPracticeState(state: PreviewPracticeState) {
  const cookieStore = await cookies();

  cookieStore.set(previewPracticeStateCookieName, JSON.stringify(state), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax"
  });
}

export async function readPreviewWrongAnswerState() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(previewWrongAnswersCookieName)?.value;

  if (!raw) {
    return defaultPreviewWrongAnswers;
  }

  try {
    return { ...defaultPreviewWrongAnswers, ...(JSON.parse(raw) as PreviewWrongAnswerState) };
  } catch {
    return defaultPreviewWrongAnswers;
  }
}

export async function writePreviewWrongAnswerState(state: PreviewWrongAnswerState) {
  const cookieStore = await cookies();

  cookieStore.set(previewWrongAnswersCookieName, JSON.stringify(state), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax"
  });
}

export async function getPracticeList(
  supabase: SupabaseClient | null,
  user: User,
  input: PracticeSearchInput
): Promise<PracticeListResult> {
  const accountTier = await getAccountTier(supabase, user, input.previewPlan);
  const activeLevel = input.level ?? "all";
  const activeKind = input.kind ?? "all";
  const query = input.query ?? "";
  const isPreview = !supabase || isAuthPreviewEnabled();

  if (isPreview) {
    const [practiceState, wrongState] = await Promise.all([readPreviewPracticeState(), readPreviewWrongAnswerState()]);
    const items = practiceSets
      .filter((entry) => activeLevel === "all" || entry.jlptLevel === activeLevel)
      .filter((entry) => activeKind === "all" || entry.kind === activeKind)
      .filter((entry) => matchesPracticeQuery(entry, query))
      .map((entry) => mergePracticeState(entry, practiceState, wrongState, accountTier));

    return {
      items,
      accountTier,
      isPreview,
      activeLevel,
      activeKind,
      query,
      stats: buildStats(items)
    };
  }

  let dbQuery = supabase
    .from("practice_sets")
    .select("id,slug,level,title,description,kind,is_jlpt_style,access_tier,questions(id,sort_order,question_type,prompt,difficulty)")
    .eq("status", "published");

  if (activeLevel !== "all") {
    dbQuery = dbQuery.eq("level", activeLevel);
  }

  if (activeKind !== "all") {
    dbQuery = dbQuery.eq("kind", activeKind);
  }

  const safeTerm = query.replace(/[%,()]/g, " ").trim();

  if (safeTerm) {
    const pattern = `%${safeTerm}%`;
    dbQuery = dbQuery.or(`title.ilike.${pattern},description.ilike.${pattern}`);
  }

  const { data, error } = await dbQuery.order("level", { ascending: true }).order("title", { ascending: true });

  if (error) {
    console.error("Practice list query failed", error);

    return {
      items: [],
      accountTier,
      isPreview,
      activeLevel,
      activeKind,
      query,
      stats: buildStats([])
    };
  }

  const rows = (data ?? []) as PracticeSetRow[];
  const setIds = rows.map((row) => row.id);
  const questionIds = rows.flatMap((row) => (row.questions ?? []).map((question) => question.id));
  const [progressRows, wrongRows] = await Promise.all([
    getPracticeProgressRows(supabase, user.id, setIds),
    getWrongRowsForQuestions(supabase, user.id, questionIds)
  ]);
  const progressMap = new Map(progressRows.map((row) => [row.practice_set_id, row]));
  const wrongMap = new Map<string, number>();

  for (const row of wrongRows) {
    wrongMap.set(row.question_id, row.wrong_count);
  }

  const items = rows.map((row) => mergeDatabaseState(mapPracticeSetRow(row), progressMap, wrongMap));

  return {
    items,
    accountTier,
    isPreview,
    activeLevel,
    activeKind,
    query,
    stats: buildStats(items)
  };
}

export async function getPracticeDetail(
  supabase: SupabaseClient | null,
  user: User,
  slug: string,
  previewPlan?: AccountTier
): Promise<PracticeDetailResult> {
  const accountTier = await getAccountTier(supabase, user, previewPlan);
  const isPreview = !supabase || isAuthPreviewEnabled();

  if (isPreview) {
    const [practiceState, wrongState] = await Promise.all([readPreviewPracticeState(), readPreviewWrongAnswerState()]);
    const entry = practiceSets.find((item) => item.slug === slug);

    if (!entry) {
      return { set: null, accountTier, isPreview, isLocked: false };
    }

    const item = mergePracticeState(entry, practiceState, wrongState, accountTier);
    const publicItem = stripCorrectAnswers(item);

    if (item.isLocked) {
      publicItem.questions = [];
    }

    return {
      set: publicItem,
      accountTier,
      isPreview,
      isLocked: item.isLocked
    };
  }

  const { data, error } = await supabase
    .from("practice_sets")
    .select(
      "id,slug,level,title,description,kind,is_jlpt_style,access_tier,questions(id,sort_order,question_type,prompt,hint,explanation,difficulty,question_options(id,option_order,option_label,option_text,explanation))"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Practice detail query failed", error);
  }

  if (!data) {
    const fallback = practiceSets.find((item) => item.slug === slug);

    return {
      set: null,
      accountTier,
      isPreview,
      isLocked: Boolean(fallback && !canAccessPracticeSet(fallback, accountTier))
    };
  }

  const row = data as PracticeSetRow;
  const questionIds = (row.questions ?? []).map((question) => question.id);
  const [progressRows, wrongRows] = await Promise.all([
    getPracticeProgressRows(supabase, user.id, [row.id]),
    getWrongRowsForQuestions(supabase, user.id, questionIds)
  ]);
  const wrongMap = new Map<string, number>();

  for (const wrongRow of wrongRows) {
    wrongMap.set(wrongRow.question_id, wrongRow.wrong_count);
  }

  const item = mergeDatabaseState(
    mapPracticeSetRow(row),
    new Map(progressRows.map((progress) => [progress.practice_set_id, progress])),
    wrongMap
  );

  return {
    set: stripCorrectAnswers(item),
    accountTier,
    isPreview,
    isLocked: false
  };
}

export async function getPreviewPracticeSetForGrading(slug: string, accountTier: AccountTier) {
  const entry = practiceSets.find((item) => item.slug === slug);

  if (!entry || !canAccessPracticeSet(entry, accountTier)) {
    return null;
  }

  return entry;
}

export function gradePracticeSet(entry: PracticeSetEntry, answers: PracticeAnswerMap): PracticeSubmissionResult {
  const results = entry.questions.map((question) => gradeQuestion(question, answers[question.id] ?? {}));
  const correct = results.filter((result) => result.isCorrect).length;
  const total = results.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;

  return {
    practiceSetId: entry.id,
    practiceSetTitle: entry.title,
    total,
    correct,
    wrong: total - correct,
    accuracy,
    recommendation: buildRecommendation(entry.kind),
    questions: results
  };
}

export async function recordPreviewPracticeResult(entry: PracticeSetEntry, result: PracticeSubmissionResult, answers: PracticeAnswerMap) {
  const [practiceState, wrongState] = await Promise.all([readPreviewPracticeState(), readPreviewWrongAnswerState()]);
  const now = new Date().toISOString();

  practiceState[entry.id] = {
    bestAccuracy: Math.max(practiceState[entry.id]?.bestAccuracy ?? 0, result.accuracy),
    lastPracticedAt: now
  };

  for (const questionResult of result.questions) {
    if (questionResult.isCorrect) {
      if (wrongState[questionResult.questionId]) {
        wrongState[questionResult.questionId] = {
          ...wrongState[questionResult.questionId],
          resolvedAt: now
        };
      }

      continue;
    }

    const answer = answers[questionResult.questionId] ?? {};
    wrongState[questionResult.questionId] = {
      wrongCount: (wrongState[questionResult.questionId]?.wrongCount ?? 0) + 1,
      lastWrongAt: now,
      resolvedAt: null,
      selectedOptionIds: answer.selectedOptionIds,
      selectedText: answer.text
    };
  }

  await Promise.all([writePreviewPracticeState(practiceState), writePreviewWrongAnswerState(wrongState)]);
}

export async function getWrongAnswerList(supabase: SupabaseClient | null, user: User, previewPlan?: AccountTier) {
  const accountTier = await getAccountTier(supabase, user, previewPlan);
  const isPreview = !supabase || isAuthPreviewEnabled();

  if (accountTier !== "pro") {
    return { items: [] as PracticeWrongAnswerItem[], accountTier, isPreview };
  }

  if (isPreview) {
    const wrongState = await readPreviewWrongAnswerState();
    const items = practiceSets.flatMap((set) =>
      set.questions
        .map((question) => ({ set, question, wrong: wrongState[question.id] }))
        .filter(({ set, wrong }) => wrong && !wrong.resolvedAt && canAccessPracticeSet(set, accountTier))
        .map(({ set, question, wrong }) => ({
          questionId: question.id,
          question: question.question,
          questionType: question.questionType,
          practiceSetSlug: set.slug,
          practiceSetTitle: set.title,
          jlptLevel: set.jlptLevel,
          kind: set.kind,
          wrongCount: wrong.wrongCount,
          lastWrongAt: wrong.lastWrongAt,
          notes: wrong.selectedText ? `text=${wrong.selectedText}` : wrong.selectedOptionIds?.join(", ")
        }))
    );

    return { items, accountTier, isPreview };
  }

  const { data, error } = await supabase
    .from("wrong_answers")
    .select(
      "question_id,wrong_count,last_wrong_at,resolved_at,notes,questions(id,prompt,question_type,practice_sets(slug,title,level,kind))"
    )
    .eq("user_id", user.id)
    .is("resolved_at", null)
    .order("last_wrong_at", { ascending: false });

  if (error) {
    console.error("Wrong answers query failed", error);
    return { items: [] as PracticeWrongAnswerItem[], accountTier, isPreview };
  }

  const items = ((data ?? []) as Array<Record<string, unknown>>)
    .map((row) => mapWrongAnswerRow(row))
    .filter((item): item is PracticeWrongAnswerItem => Boolean(item));

  return { items, accountTier, isPreview };
}

function gradeQuestion(question: PracticeQuestion, answer: PracticeAnswerInput): PracticeQuestionResult {
  const selectedOptionIds = normalizeAnswerIds(answer.selectedOptionIds);
  const correctOptionIds = normalizeAnswerIds(question.correctOptionIds);
  const selectedText = (answer.text ?? "").trim();
  const correctTexts = (question.correctTexts ?? []).map((value) => value.trim());
  const isTextQuestion = question.questionType === "fill_blank" || question.questionType === "text_input";
  const isCorrect = isTextQuestion
    ? correctTexts.some((value) => normalizeText(value) === normalizeText(selectedText))
    : sameStringSet(selectedOptionIds, correctOptionIds);

  return {
    questionId: question.id,
    question: question.question,
    questionType: question.questionType,
    difficulty: question.difficulty,
    isCorrect,
    selectedLabels: labelsForOptions(question.options, selectedOptionIds),
    selectedText,
    correctLabels: labelsForOptions(question.options, correctOptionIds),
    correctTexts,
    explanation: question.explanation,
    reviewSuggestion: question.reviewSuggestion
  };
}

function normalizeAnswerIds(values: string[] | undefined) {
  return Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean))).sort();
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function sameStringSet(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function labelsForOptions(options: PracticeOption[], optionIds: string[]) {
  const optionMap = new Map(options.map((option) => [option.id, option.label]));

  return optionIds.map((optionId) => optionMap.get(optionId)).filter((label): label is string => Boolean(label));
}

function buildRecommendation(kind: PracticeKind) {
  switch (kind) {
    case "vocabulary":
      return "回到单词模块复习同等级高频词，并把错题词加入复习。";
    case "grammar":
      return "回到语法模块复习相关句型，重点看接续和例句。";
    case "reading":
      return "回到文章模块重读原文，整理关键词、指代和因果线索。";
    case "jlpt_mock":
      return "进入 JLPT 专项，按错题类型重做原创模拟题。";
    case "mixed":
      return "按错题类型分别复习单词、语法和阅读。";
  }
}

function matchesPracticeQuery(entry: PracticeSetEntry, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    entry.title,
    entry.description,
    entry.kind,
    entry.questions.map((question) => `${question.question} ${question.explanation}`).join(" ")
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function mergePracticeState(
  entry: PracticeSetEntry,
  practiceState: PreviewPracticeState,
  wrongState: PreviewWrongAnswerState,
  accountTier: AccountTier
): PracticeSetWithState {
  const canAccess = canAccessPracticeSet(entry, accountTier);
  const visibleEntry = canAccess
    ? entry
    : {
        ...entry,
        title: `${entry.jlptLevel} 高级练习`,
        description: "PRO 解锁后查看完整题目、答案解析和错题记录。",
        estimatedMinutes: 0,
        questions: []
      };
  const state = canAccess ? (practiceState[entry.id] ?? {}) : {};
  const wrongCount = canAccess
    ? entry.questions.filter((question) => {
        const wrong = wrongState[question.id];

        return wrong && !wrong.resolvedAt;
      }).length
    : 0;

  return {
    ...visibleEntry,
    canAccess,
    isLocked: !canAccess,
    wrongCount,
    lastPracticedAt: state.lastPracticedAt ?? null,
    bestAccuracy: state.bestAccuracy ?? 0
  };
}

function mergeDatabaseState(
  entry: PracticeSetEntry,
  progressMap: Map<string, ProgressRow>,
  wrongMap: Map<string, number>
): PracticeSetWithState {
  const progress = progressMap.get(entry.id);
  const wrongCount = entry.questions.filter((question) => wrongMap.has(question.id)).length;

  return {
    ...entry,
    canAccess: true,
    isLocked: false,
    wrongCount,
    lastPracticedAt: progress?.last_studied_at ?? null,
    bestAccuracy: Number(progress?.mastery_score ?? 0)
  };
}

function mapPracticeSetRow(row: PracticeSetRow): PracticeSetEntry {
  const questions = [...(row.questions ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((question): PracticeQuestion => {
      const questionType = question.question_type;

      return {
        id: question.id,
        questionType,
        question: question.prompt,
        passage: questionType === "reading_comprehension" ? (question.hint ?? undefined) : undefined,
        hint: questionType !== "reading_comprehension" ? (question.hint ?? undefined) : undefined,
        explanation: question.explanation ?? "请结合题干和选项重新整理判断依据。",
        difficulty: Number(question.difficulty ?? 3),
        jlptLevel: row.level,
        options: [...(question.question_options ?? [])]
          .sort((a, b) => a.option_order - b.option_order)
          .map((option) => ({
            id: option.id,
            label: option.option_label,
            text: option.option_text,
            explanation: option.explanation ?? undefined
          })),
        source: { type: "practice", title: row.title, href: `/practice/${row.slug}` },
        reviewSuggestion: buildRecommendation(row.kind)
      };
    });

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    jlptLevel: row.level,
    kind: row.kind,
    isJlptStyle: row.is_jlpt_style,
    accessTier: row.access_tier,
    estimatedMinutes: Math.max(6, questions.length * 4),
    questions
  };
}

function stripCorrectAnswers(entry: PracticeSetWithState): PracticePublicSet {
  return {
    ...entry,
    questions: entry.questions.map(({ correctOptionIds: _correctOptionIds, correctTexts: _correctTexts, ...question }) => question)
  };
}

async function getPracticeProgressRows(supabase: SupabaseClient, userId: string, practiceSetIds: string[]) {
  if (practiceSetIds.length === 0) {
    return [] as ProgressRow[];
  }

  const { data, error } = await supabase
    .from("user_progress")
    .select("practice_set_id,mastery_score,last_studied_at")
    .eq("user_id", userId)
    .eq("content_type", "practice_set")
    .in("practice_set_id", practiceSetIds);

  if (error) {
    console.error("Practice progress query failed", error);
    return [] as ProgressRow[];
  }

  return (data ?? []) as ProgressRow[];
}

async function getWrongRowsForQuestions(supabase: SupabaseClient, userId: string, questionIds: string[]) {
  if (questionIds.length === 0) {
    return [] as WrongAnswerRow[];
  }

  const { data, error } = await supabase
    .from("wrong_answers")
    .select("question_id,wrong_count,last_wrong_at,resolved_at,notes")
    .eq("user_id", userId)
    .is("resolved_at", null)
    .in("question_id", questionIds);

  if (error) {
    console.error("Wrong answer state query failed", error);
    return [] as WrongAnswerRow[];
  }

  return (data ?? []) as WrongAnswerRow[];
}

function buildStats(items: PracticeSetWithState[]): PracticeListResult["stats"] {
  const unlocked = items.filter((item) => item.canAccess);
  const bestAccuracy = unlocked.length
    ? Math.round(unlocked.reduce((sum, item) => sum + item.bestAccuracy, 0) / unlocked.length)
    : 0;

  return {
    total: items.length,
    unlocked: unlocked.length,
    questions: unlocked.reduce((sum, item) => sum + item.questions.length, 0),
    wrong: unlocked.reduce((sum, item) => sum + item.wrongCount, 0),
    bestAccuracy
  };
}

function mapWrongAnswerRow(row: Record<string, unknown>): PracticeWrongAnswerItem | null {
  const rawQuestion = Array.isArray(row.questions) ? row.questions[0] : row.questions;
  const question = rawQuestion as
    | {
        id?: string;
        prompt?: string;
        question_type?: QuestionType;
        practice_sets?:
          | {
              slug?: string;
              title?: string;
              level?: Level;
              kind?: PracticeKind;
            }
          | Array<{
              slug?: string;
              title?: string;
              level?: Level;
              kind?: PracticeKind;
            }>;
      }
    | undefined;
  const set = Array.isArray(question?.practice_sets) ? question?.practice_sets[0] : question?.practice_sets;

  if (!question?.id || !question.prompt || !set?.slug || !set.title || !set.level || !set.kind) {
    return null;
  }

  return {
    questionId: question.id,
    question: question.prompt,
    questionType: question.question_type ?? "single_choice",
    practiceSetSlug: set.slug,
    practiceSetTitle: set.title,
    jlptLevel: set.level,
    kind: set.kind,
    wrongCount: Number(row.wrong_count ?? 1),
    lastWrongAt: String(row.last_wrong_at ?? new Date().toISOString()),
    notes: typeof row.notes === "string" ? row.notes : null
  };
}

export function allPracticeLevels() {
  return levels;
}

export { normalizePreviewPlan };
