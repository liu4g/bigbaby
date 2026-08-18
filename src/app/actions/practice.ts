"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  getPreviewPracticeSetForGrading,
  gradePracticeSet,
  normalizePreviewPlan,
  recordPreviewPracticeResult,
  type PracticeActionState,
  type PracticeAnswerMap,
  type PracticeQuestionResult,
  type PracticeSubmissionResult
} from "@/lib/practice";
import type { QuestionType } from "@/lib/practice-data";
import { getAccountTier } from "@/lib/vocabulary";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const questionTypes = new Set<QuestionType>([
  "single_choice",
  "multiple_choice",
  "fill_blank",
  "reading_comprehension",
  "text_input"
]);

export async function submitPracticeAction(
  _state: PracticeActionState,
  formData: FormData
): Promise<PracticeActionState> {
  const { supabase, user } = await requireUser();
  const slug = getFormString(formData, "practice_slug");
  const previewPlan = normalizePreviewPlan(getFormString(formData, "plan"));
  const answers = collectPracticeAnswers(formData);

  if (!slug) {
    return { status: "error", message: "缺少练习信息。" };
  }

  if (Object.keys(answers).length === 0) {
    return { status: "error", message: "没有收到题目答案。" };
  }

  if (!supabase) {
    const accountTier = await getAccountTier(null, user, previewPlan);
    const practiceSet = await getPreviewPracticeSetForGrading(slug, accountTier);

    if (!practiceSet) {
      return { status: "error", message: "当前账号没有访问这套练习的权限。" };
    }

    const result = gradePracticeSet(practiceSet, answers);
    await recordPreviewPracticeResult(practiceSet, result, answers);
    refreshPracticePaths(slug);

    return { status: "success", result };
  }

  const { data, error } = await supabase.rpc("submit_practice_answers", {
    target_practice_slug: slug,
    responses: answers
  });

  if (error) {
    console.error("Practice submission failed", error);

    return {
      status: "error",
      message: error.code === "42501" ? "当前账号没有访问这套练习的权限。" : "提交失败，请稍后再试。"
    };
  }

  const result = normalizeSubmissionResult(data);

  if (!result) {
    return { status: "error", message: "服务器返回了无法识别的练习结果。" };
  }

  refreshPracticePaths(slug);

  return { status: "success", result };
}

function collectPracticeAnswers(formData: FormData): PracticeAnswerMap {
  const questionIds = formData
    .getAll("question_id")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => uuidPattern.test(value));
  const answers: PracticeAnswerMap = {};

  for (const questionId of questionIds) {
    const selectedOptionIds = formData
      .getAll(`answer_${questionId}`)
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => uuidPattern.test(value));
    const text = getFormString(formData, `text_${questionId}`);

    answers[questionId] = {
      selectedOptionIds,
      text
    };
  }

  return answers;
}

function normalizeSubmissionResult(value: unknown): PracticeSubmissionResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const questions = Array.isArray(raw.questions)
    ? raw.questions.map(normalizeQuestionResult).filter((item): item is PracticeQuestionResult => Boolean(item))
    : [];
  const total = toNumber(raw.total);
  const correct = toNumber(raw.correct);
  const wrong = toNumber(raw.wrong);

  if (!raw.practiceSetTitle || typeof raw.practiceSetTitle !== "string" || questions.length === 0) {
    return null;
  }

  return {
    practiceSetId: typeof raw.practiceSetId === "string" ? raw.practiceSetId : undefined,
    practiceSetTitle: raw.practiceSetTitle,
    total,
    correct,
    wrong,
    accuracy: toNumber(raw.accuracy),
    recommendation: typeof raw.recommendation === "string" ? raw.recommendation : "请根据错题类型安排复习。",
    questions
  };
}

function normalizeQuestionResult(value: unknown): PracticeQuestionResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const questionType = typeof raw.questionType === "string" && questionTypes.has(raw.questionType as QuestionType)
    ? (raw.questionType as QuestionType)
    : "single_choice";

  if (typeof raw.questionId !== "string" || typeof raw.question !== "string") {
    return null;
  }

  return {
    questionId: raw.questionId,
    question: raw.question,
    questionType,
    difficulty: toNumber(raw.difficulty),
    isCorrect: Boolean(raw.isCorrect),
    selectedLabels: toStringArray(raw.selectedLabels),
    selectedText: typeof raw.selectedText === "string" ? raw.selectedText : "",
    correctLabels: toStringArray(raw.correctLabels),
    correctTexts: toStringArray(raw.correctTexts),
    explanation: typeof raw.explanation === "string" ? raw.explanation : "请结合题干和选项重新整理判断依据。",
    reviewSuggestion: typeof raw.reviewSuggestion === "string" ? raw.reviewSuggestion : "回到对应模块复习相关内容。"
  };
}

function toNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  return Number.isFinite(parsed) ? parsed : 0;
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function refreshPracticePaths(slug: string) {
  revalidatePath("/practice");
  revalidatePath(`/practice/${slug}`);
  revalidatePath("/practice/wrong-answers");
}
