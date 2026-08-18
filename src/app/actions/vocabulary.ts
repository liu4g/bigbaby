"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, safeRedirectPath } from "@/lib/auth";
import {
  canAccessVocabulary,
  getAccountTier,
  normalizePreviewPlan,
  readPreviewVocabularyState,
  writePreviewVocabularyState,
  type PreviewVocabularyState
} from "@/lib/vocabulary";
import { vocabularyEntries, type VocabularyProgressStatus } from "@/lib/vocabulary-data";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const allowedStatuses = new Set<VocabularyProgressStatus>(["not_started", "in_progress", "completed", "suspended"]);

export async function toggleVocabularyBookmarkAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const vocabularyId = getVocabularyId(formData);
  const returnTo = safeRedirectPath(formData.get("return_to"), "/vocabulary");
  const previewPlan = normalizePreviewPlan(getFormString(formData, "plan"));

  if (!vocabularyId) {
    redirect(returnTo);
  }

  if (!supabase) {
    await updatePreviewVocabularyState(vocabularyId, previewPlan, (state) => {
      state[vocabularyId] = {
        ...state[vocabularyId],
        bookmarked: !state[vocabularyId]?.bookmarked
      };
    });
    refreshVocabularyPaths(returnTo);
    redirect(returnTo);
  }

  const accessible = await hasVocabularyAccess(supabase, vocabularyId);

  if (!accessible) {
    redirect(returnTo);
  }

  const { data: existing } = await supabase
    .from("user_bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("content_type", "vocabulary")
    .eq("vocabulary_id", vocabularyId)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("user_bookmarks").delete().eq("id", existing.id).eq("user_id", user.id);
  } else {
    await supabase.from("user_bookmarks").insert({
      user_id: user.id,
      content_type: "vocabulary",
      vocabulary_id: vocabularyId
    });
  }

  refreshVocabularyPaths(returnTo);
  redirect(returnTo);
}

export async function setVocabularyStatusAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const vocabularyId = getVocabularyId(formData);
  const returnTo = safeRedirectPath(formData.get("return_to"), "/vocabulary");
  const previewPlan = normalizePreviewPlan(getFormString(formData, "plan"));
  const status = normalizeStatus(getFormString(formData, "status"));

  if (!vocabularyId || !status) {
    redirect(returnTo);
  }

  const masteryScore = status === "completed" ? 100 : status === "in_progress" ? 35 : 0;
  const nextReviewAt = status === "completed" ? nextReviewDate(7) : status === "in_progress" ? nextReviewDate(1) : null;

  if (!supabase) {
    await updatePreviewVocabularyState(vocabularyId, previewPlan, (state) => {
      state[vocabularyId] = {
        ...state[vocabularyId],
        status,
        masteryScore,
        nextReviewAt
      };
    });
    refreshVocabularyPaths(returnTo);
    redirect(returnTo);
  }

  const accessible = await hasVocabularyAccess(supabase, vocabularyId);

  if (!accessible) {
    redirect(returnTo);
  }

  await supabase.from("user_vocabulary").upsert(
    {
      user_id: user.id,
      vocabulary_id: vocabularyId,
      status,
      mastery_score: masteryScore,
      last_studied_at: new Date().toISOString(),
      next_review_at: nextReviewAt
    },
    { onConflict: "user_id,vocabulary_id" }
  );

  refreshVocabularyPaths(returnTo);
  redirect(returnTo);
}

export async function addVocabularyToReviewAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const vocabularyId = getVocabularyId(formData);
  const returnTo = safeRedirectPath(formData.get("return_to"), "/vocabulary");
  const previewPlan = normalizePreviewPlan(getFormString(formData, "plan"));

  if (!vocabularyId) {
    redirect(returnTo);
  }

  if (!supabase) {
    await updatePreviewVocabularyState(vocabularyId, previewPlan, (state) => {
      state[vocabularyId] = {
        ...state[vocabularyId],
        status: "in_progress",
        masteryScore: Math.max(state[vocabularyId]?.masteryScore ?? 0, 45),
        nextReviewAt: new Date().toISOString()
      };
    });
    refreshVocabularyPaths(returnTo);
    redirect(returnTo);
  }

  const accessible = await hasVocabularyAccess(supabase, vocabularyId);

  if (!accessible) {
    redirect(returnTo);
  }

  await supabase.from("user_vocabulary").upsert(
    {
      user_id: user.id,
      vocabulary_id: vocabularyId,
      status: "in_progress",
      mastery_score: 45,
      last_studied_at: new Date().toISOString(),
      next_review_at: new Date().toISOString()
    },
    { onConflict: "user_id,vocabulary_id" }
  );

  refreshVocabularyPaths(returnTo);
  redirect(returnTo);
}

async function updatePreviewVocabularyState(
  vocabularyId: string,
  previewPlan: "free" | "pro" | undefined,
  updater: (state: PreviewVocabularyState) => void
) {
  const entry = vocabularyEntries.find((item) => item.id === vocabularyId);

  if (!entry) {
    return;
  }

  const accountTier = await getAccountTier(null, { id: "preview" } as never, previewPlan);

  if (!canAccessVocabulary(entry, accountTier)) {
    return;
  }

  const state = await readPreviewVocabularyState();
  updater(state);
  await writePreviewVocabularyState(state);
}

async function hasVocabularyAccess(supabase: NonNullable<Awaited<ReturnType<typeof requireUser>>["supabase"]>, vocabularyId: string) {
  const { data, error } = await supabase.from("vocabulary").select("id").eq("id", vocabularyId).maybeSingle();

  return !error && Boolean(data?.id);
}

function getVocabularyId(formData: FormData) {
  const value = getFormString(formData, "vocabulary_id");

  return uuidPattern.test(value) ? value : "";
}

function normalizeStatus(value: string): VocabularyProgressStatus | null {
  return allowedStatuses.has(value as VocabularyProgressStatus) ? (value as VocabularyProgressStatus) : null;
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function nextReviewDate(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function refreshVocabularyPaths(returnTo: string) {
  const path = returnTo.split("?")[0] || "/vocabulary";

  revalidatePath("/vocabulary");
  revalidatePath(path);
}
