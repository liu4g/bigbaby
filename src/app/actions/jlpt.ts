"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  getJlptExamForGrading,
  gradeJlptExam,
  normalizePreviewPlan,
  recordJlptDatabaseAttempt,
  recordJlptPreviewAttempt,
  type JlptActionState,
  type JlptAnswerMap,
  type JlptExamResult,
  type JlptQuestionResult,
  type JlptSectionResult,
  type JlptWeakPoint
} from "@/lib/jlpt";
import { getAccountTier } from "@/lib/vocabulary";

const safeIdPattern = /^[A-Za-z0-9-]{8,96}$/;

export async function submitJlptExamAction(_state: JlptActionState, formData: FormData): Promise<JlptActionState> {
  const { supabase, user } = await requireUser();
  const slug = getFormString(formData, "exam_slug");
  const previewPlan = normalizePreviewPlan(getFormString(formData, "plan"));
  const startedAt = getFormString(formData, "started_at");
  const remainingSeconds = Number(getFormString(formData, "remaining_seconds"));
  const answers = collectAnswers(formData);
  const accountTier = await getAccountTier(supabase, user, previewPlan);
  const exam = getJlptExamForGrading(slug, accountTier);

  if (!exam) {
    return {
      status: "error",
      message: "当前账号没有访问这套 JLPT 模拟考试的权限。"
    };
  }

  if (Object.keys(answers).length === 0) {
    return {
      status: "error",
      message: "没有收到考试答案。"
    };
  }

  const result = gradeJlptExam(exam, answers, {
    startedAt,
    remainingSeconds: Number.isFinite(remainingSeconds) ? remainingSeconds : undefined
  });

  if (supabase) {
    await recordJlptDatabaseAttempt(supabase, user.id, result, answers);
  } else {
    await recordJlptPreviewAttempt(result);
  }

  revalidatePath("/jlpt");
  revalidatePath(`/jlpt/${exam.level.toLowerCase()}`);
  revalidatePath(`/jlpt/exams/${exam.slug}`);

  return {
    status: "success",
    result: normalizeResult(result)
  };
}

function collectAnswers(formData: FormData): JlptAnswerMap {
  const questionIds = formData
    .getAll("question_id")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => safeIdPattern.test(value));
  const answers: JlptAnswerMap = {};

  for (const questionId of questionIds) {
    const selectedOptionIds = formData
      .getAll(`answer_${questionId}`)
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => safeIdPattern.test(value));
    const text = getFormString(formData, `text_${questionId}`);

    answers[questionId] = {
      selectedOptionIds,
      text
    };
  }

  return answers;
}

function normalizeResult(result: JlptExamResult): JlptExamResult {
  return {
    ...result,
    sectionResults: result.sectionResults.map(normalizeSectionResult),
    questions: result.questions.map(normalizeQuestionResult),
    wrongQuestions: result.wrongQuestions.map(normalizeQuestionResult),
    weakPoints: result.weakPoints.map(normalizeWeakPoint)
  };
}

function normalizeSectionResult(result: JlptSectionResult): JlptSectionResult {
  return {
    ...result,
    score: Number(result.score),
    totalScore: Number(result.totalScore),
    correct: Number(result.correct),
    total: Number(result.total),
    accuracy: Number(result.accuracy)
  };
}

function normalizeQuestionResult(result: JlptQuestionResult): JlptQuestionResult {
  return {
    ...result,
    score: Number(result.score),
    totalScore: Number(result.totalScore),
    selectedLabels: result.selectedLabels.filter(Boolean),
    correctLabels: result.correctLabels.filter(Boolean),
    correctTexts: result.correctTexts.filter(Boolean),
    skillTags: result.skillTags.filter(Boolean)
  };
}

function normalizeWeakPoint(result: JlptWeakPoint): JlptWeakPoint {
  return {
    tag: result.tag,
    count: Number(result.count)
  };
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
