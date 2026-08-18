import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isLevel, levels, type Level, type LevelFilter } from "@/lib/site";
import { canAccessContent, getAccountTier, normalizePreviewPlan, type AccountTier } from "@/lib/access-control";
import {
  jlptDownloadResources,
  jlptExams,
  jlptLevels,
  type JlptAccessTier,
  type JlptExam,
  type JlptExamWithState,
  type JlptPublicExam,
  type JlptQuestion,
  type JlptQuestionType,
  type JlptSectionKind
} from "@/lib/jlpt-data";

export type JlptAnswerInput = {
  selectedOptionIds?: string[];
  text?: string;
};

export type JlptAnswerMap = Record<string, JlptAnswerInput>;

export type JlptSectionResult = {
  sectionId: string;
  kind: JlptSectionKind;
  title: string;
  score: number;
  totalScore: number;
  correct: number;
  total: number;
  accuracy: number;
};

export type JlptQuestionResult = {
  questionId: string;
  sectionId: string;
  sectionTitle: string;
  questionType: JlptQuestionType;
  question: string;
  isCorrect: boolean;
  score: number;
  totalScore: number;
  selectedLabels: string[];
  selectedText: string;
  correctLabels: string[];
  correctTexts: string[];
  explanation: string;
  skillTags: string[];
};

export type JlptWeakPoint = {
  tag: string;
  count: number;
};

export type JlptExamResult = {
  examId: string;
  examTitle: string;
  level: Level;
  score: number;
  totalScore: number;
  accuracy: number;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  sectionResults: JlptSectionResult[];
  questions: JlptQuestionResult[];
  wrongQuestions: JlptQuestionResult[];
  weakPoints: JlptWeakPoint[];
};

export type JlptActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  result?: JlptExamResult;
};

export type JlptPreviewAttemptState = Record<
  string,
  {
    bestScore: number;
    lastScore: number;
    lastAccuracy: number;
    lastAttemptAt: string;
  }
>;

export type JlptOverviewResult = {
  accountTier: AccountTier;
  tracks: typeof jlptLevels;
  exams: JlptExamWithState[];
  resources: typeof jlptDownloadResources;
  stats: {
    exams: number;
    unlocked: number;
    originalExams: number;
    resourceEntries: number;
  };
};

export type JlptLevelResult = {
  accountTier: AccountTier;
  level: Level;
  track: (typeof jlptLevels)[number] | null;
  exams: JlptExamWithState[];
  resources: typeof jlptDownloadResources;
};

export type JlptExamDetailResult = {
  accountTier: AccountTier;
  exam: JlptPublicExam | null;
  isLocked: boolean;
};

const previewAttemptCookieName = "japanweb_jlpt_attempts";

const defaultPreviewAttempts: JlptPreviewAttemptState = {
  "10000000-0000-0000-0000-000000000501": {
    bestScore: 75,
    lastScore: 75,
    lastAccuracy: 75,
    lastAttemptAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  "10000000-0000-0000-0000-000000000503": {
    bestScore: 50,
    lastScore: 50,
    lastAccuracy: 50,
    lastAttemptAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
};

type AttemptRow = {
  exam_id: string;
  score_obtained: number;
  accuracy: number;
  submitted_at: string | null;
  created_at: string;
};

export function normalizeJlptLevel(value: string | string[] | undefined): LevelFilter {
  const candidate = Array.isArray(value) ? value[0] : value;

  return isLevel(candidate) ? candidate : "all";
}

export function canAccessJlptContent(entry: Pick<JlptExam, "accessTier" | "level"> | { accessTier: JlptAccessTier; level: Level }, accountTier: AccountTier) {
  return canAccessContent(accountTier, entry.level, entry.accessTier);
}

export function getJlptLevelHref(level: Level, plan?: AccountTier) {
  const params = new URLSearchParams();

  if (plan) {
    params.set("plan", plan);
  }

  const search = params.toString();

  return search ? `/jlpt/${level.toLowerCase()}?${search}` : `/jlpt/${level.toLowerCase()}`;
}

export function getJlptExamHref(slug: string, plan?: AccountTier) {
  const params = new URLSearchParams();

  if (plan) {
    params.set("plan", plan);
  }

  const search = params.toString();

  return search ? `/jlpt/exams/${slug}?${search}` : `/jlpt/exams/${slug}`;
}

export async function readPreviewJlptAttemptState() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(previewAttemptCookieName)?.value;

  if (!raw) {
    return defaultPreviewAttempts;
  }

  try {
    return { ...defaultPreviewAttempts, ...(JSON.parse(raw) as JlptPreviewAttemptState) };
  } catch {
    return defaultPreviewAttempts;
  }
}

export async function writePreviewJlptAttemptState(state: JlptPreviewAttemptState) {
  const cookieStore = await cookies();

  cookieStore.set(previewAttemptCookieName, JSON.stringify(state), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax"
  });
}

export async function getJlptOverview(
  supabase: SupabaseClient | null,
  user: User,
  previewPlan?: AccountTier
): Promise<JlptOverviewResult> {
  const accountTier = await getAccountTier(supabase, user, previewPlan);
  const state = await readAttemptState(supabase, user.id);
  const exams = jlptExams.map((exam) => mergeExamState(exam, state, accountTier));

  return {
    accountTier,
    tracks: jlptLevels,
    exams,
    resources: jlptDownloadResources,
    stats: {
      exams: exams.length,
      unlocked: exams.filter((exam) => exam.canAccess).length,
      originalExams: exams.filter((exam) => exam.isOriginal).length,
      resourceEntries: jlptDownloadResources.length
    }
  };
}

export async function getJlptLevelDetail(
  supabase: SupabaseClient | null,
  user: User,
  level: Level,
  previewPlan?: AccountTier
): Promise<JlptLevelResult> {
  const accountTier = await getAccountTier(supabase, user, previewPlan);
  const state = await readAttemptState(supabase, user.id);

  return {
    accountTier,
    level,
    track: jlptLevels.find((track) => track.level === level) ?? null,
    exams: jlptExams.filter((exam) => exam.level === level).map((exam) => mergeExamState(exam, state, accountTier)),
    resources: jlptDownloadResources.filter((resource) => resource.level === level)
  };
}

export async function getJlptExamDetail(
  supabase: SupabaseClient | null,
  user: User,
  slug: string,
  previewPlan?: AccountTier
): Promise<JlptExamDetailResult> {
  const accountTier = await getAccountTier(supabase, user, previewPlan);
  const state = await readAttemptState(supabase, user.id);
  const exam = jlptExams.find((item) => item.slug === slug);

  if (!exam) {
    return { accountTier, exam: null, isLocked: false };
  }

  const withState = mergeExamState(exam, state, accountTier);

  if (!withState.canAccess) {
    return {
      accountTier,
      exam: {
        ...stripExamAnswers(withState),
        title: `${exam.level} 高级原创模拟考试`,
        description: "PRO 解锁后查看完整考试、计时答题、解析和薄弱知识点。",
        sections: []
      },
      isLocked: true
    };
  }

  return {
    accountTier,
    exam: stripExamAnswers(withState),
    isLocked: false
  };
}

export async function getJlptResources(
  supabase: SupabaseClient | null,
  user: User,
  previewPlan?: AccountTier
) {
  const accountTier = await getAccountTier(supabase, user, previewPlan);

  return {
    accountTier,
    resources: jlptDownloadResources.map((resource) => ({
      ...resource,
      canAccess: canAccessJlptContent(resource, accountTier)
    }))
  };
}

export function getJlptExamForGrading(slug: string, accountTier: AccountTier) {
  const exam = jlptExams.find((item) => item.slug === slug);

  if (!exam || !canAccessJlptContent(exam, accountTier)) {
    return null;
  }

  return exam;
}

export function gradeJlptExam(exam: JlptExam, answers: JlptAnswerMap, meta: { startedAt?: string; remainingSeconds?: number }): JlptExamResult {
  const submittedAt = new Date().toISOString();
  const startedAt = meta.startedAt && !Number.isNaN(new Date(meta.startedAt).getTime()) ? meta.startedAt : submittedAt;
  const durationSeconds = Math.max(
    0,
    Math.min(exam.durationSeconds, exam.durationSeconds - Math.max(0, Number(meta.remainingSeconds ?? exam.durationSeconds)))
  );
  const sectionResults: JlptSectionResult[] = [];
  const questionResults: JlptQuestionResult[] = [];
  const weakPointMap = new Map<string, number>();

  for (const section of exam.sections) {
    let sectionScore = 0;
    let sectionTotalScore = 0;
    let sectionCorrect = 0;

    for (const question of section.questions) {
      const result = gradeQuestion(section.id, section.title, question, answers[question.id] ?? {});
      questionResults.push(result);
      sectionScore += result.score;
      sectionTotalScore += result.totalScore;

      if (result.isCorrect) {
        sectionCorrect += 1;
      } else {
        for (const tag of result.skillTags) {
          weakPointMap.set(tag, (weakPointMap.get(tag) ?? 0) + 1);
        }
      }
    }

    sectionResults.push({
      sectionId: section.id,
      kind: section.kind,
      title: section.title,
      score: sectionScore,
      totalScore: sectionTotalScore,
      correct: sectionCorrect,
      total: section.questions.length,
      accuracy: section.questions.length > 0 ? Math.round((sectionCorrect / section.questions.length) * 10000) / 100 : 0
    });
  }

  const score = sectionResults.reduce((sum, section) => sum + section.score, 0);
  const totalScore = sectionResults.reduce((sum, section) => sum + section.totalScore, 0);
  const wrongQuestions = questionResults.filter((question) => !question.isCorrect);
  const weakPoints = Array.from(weakPointMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return {
    examId: exam.id,
    examTitle: exam.title,
    level: exam.level,
    score,
    totalScore,
    accuracy: totalScore > 0 ? Math.round((score / totalScore) * 10000) / 100 : 0,
    startedAt,
    submittedAt,
    durationSeconds,
    sectionResults,
    questions: questionResults,
    wrongQuestions,
    weakPoints
  };
}

export async function recordJlptPreviewAttempt(result: JlptExamResult) {
  const state = await readPreviewJlptAttemptState();

  state[result.examId] = {
    bestScore: Math.max(state[result.examId]?.bestScore ?? 0, result.score),
    lastScore: result.score,
    lastAccuracy: result.accuracy,
    lastAttemptAt: result.submittedAt
  };

  await writePreviewJlptAttemptState(state);
}

export async function recordJlptDatabaseAttempt(
  supabase: SupabaseClient,
  userId: string,
  result: JlptExamResult,
  answers: JlptAnswerMap
) {
  await supabase.from("jlpt_exam_attempts").insert({
    user_id: userId,
    exam_id: result.examId,
    started_at: result.startedAt,
    submitted_at: result.submittedAt,
    duration_seconds: result.durationSeconds,
    score_obtained: result.score,
    total_score: result.totalScore,
    accuracy: result.accuracy,
    section_scores: result.sectionResults,
    weak_points: result.weakPoints.map((point) => point.tag),
    answers,
    status: "submitted"
  });
}

function gradeQuestion(
  sectionId: string,
  sectionTitle: string,
  question: JlptQuestion,
  answer: JlptAnswerInput
): JlptQuestionResult {
  const selectedOptionIds = normalizeAnswerIds(answer.selectedOptionIds);
  const correctOptionIds = normalizeAnswerIds(question.correctOptionIds);
  const selectedText = (answer.text ?? "").trim();
  const correctTexts = (question.correctTexts ?? []).map((value) => value.trim());
  const isTextQuestion = question.questionType === "fill_blank";
  const isCorrect = isTextQuestion
    ? correctTexts.some((value) => normalizeText(value) === normalizeText(selectedText))
    : sameStringSet(selectedOptionIds, correctOptionIds);

  return {
    questionId: question.id,
    sectionId,
    sectionTitle,
    questionType: question.questionType,
    question: question.prompt,
    isCorrect,
    score: isCorrect ? question.points : 0,
    totalScore: question.points,
    selectedLabels: labelsForOptions(question, selectedOptionIds),
    selectedText,
    correctLabels: labelsForOptions(question, correctOptionIds),
    correctTexts,
    explanation: question.explanation,
    skillTags: question.skillTags
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

function labelsForOptions(question: JlptQuestion, optionIds: string[]) {
  const optionMap = new Map(question.options.map((option) => [option.id, option.label]));

  return optionIds.map((optionId) => optionMap.get(optionId)).filter((label): label is string => Boolean(label));
}

function stripExamAnswers(exam: JlptExamWithState): JlptPublicExam {
  return {
    ...exam,
    sections: exam.sections.map((section) => ({
      ...section,
      questions: section.questions.map(({ correctOptionIds: _correctOptionIds, correctTexts: _correctTexts, ...question }) => question)
    }))
  };
}

function mergeExamState(
  exam: JlptExam,
  attemptState: JlptPreviewAttemptState,
  accountTier: AccountTier
): JlptExamWithState {
  const canAccess = canAccessJlptContent(exam, accountTier);
  const state = attemptState[exam.id];
  const visibleExam = canAccess
    ? exam
    : {
        ...exam,
        title: `${exam.level} 高级原创模拟考试`,
        description: "PRO 解锁后查看完整考试、计时答题、解析和薄弱知识点。",
        sections: []
      };

  return {
    ...visibleExam,
    canAccess,
    isLocked: !canAccess,
    bestScore: canAccess ? (state?.bestScore ?? 0) : 0,
    lastAttemptAt: canAccess ? (state?.lastAttemptAt ?? null) : null
  };
}

async function readAttemptState(supabase: SupabaseClient | null, userId: string) {
  if (!supabase) {
    return readPreviewJlptAttemptState();
  }

  const examIds = jlptExams.map((exam) => exam.id);
  const { data, error } = await supabase
    .from("jlpt_exam_attempts")
    .select("exam_id,score_obtained,accuracy,submitted_at,created_at")
    .eq("user_id", userId)
    .in("exam_id", examIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("JLPT attempts query failed", error);
    return {} as JlptPreviewAttemptState;
  }

  const state: JlptPreviewAttemptState = {};

  for (const row of (data ?? []) as AttemptRow[]) {
    const previous = state[row.exam_id];
    const score = Number(row.score_obtained ?? 0);

    state[row.exam_id] = {
      bestScore: Math.max(previous?.bestScore ?? 0, score),
      lastScore: previous?.lastScore ?? score,
      lastAccuracy: previous?.lastAccuracy ?? Number(row.accuracy ?? 0),
      lastAttemptAt: previous?.lastAttemptAt ?? row.submitted_at ?? row.created_at
    };
  }

  return state;
}

export function allJlptLevels() {
  return levels;
}

export { normalizePreviewPlan };
