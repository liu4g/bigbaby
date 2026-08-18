"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, safeRedirectPath } from "@/lib/auth";
import {
  canAccessGrammar,
  normalizePreviewPlan,
  readPreviewGrammarState,
  writePreviewGrammarState,
  type PreviewGrammarState
} from "@/lib/grammar";
import { getAccountTier } from "@/lib/vocabulary";
import { grammarEntries, type GrammarProgressStatus } from "@/lib/grammar-data";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const allowedStatuses = new Set<GrammarProgressStatus>(["not_started", "in_progress", "completed", "suspended"]);

export async function toggleGrammarBookmarkAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const grammarId = getGrammarId(formData);
  const returnTo = safeRedirectPath(formData.get("return_to"), "/grammar");
  const previewPlan = normalizePreviewPlan(getFormString(formData, "plan"));

  if (!grammarId) {
    redirect(returnTo);
  }

  if (!supabase) {
    await updatePreviewGrammarState(grammarId, previewPlan, (state) => {
      state[grammarId] = {
        ...state[grammarId],
        bookmarked: !state[grammarId]?.bookmarked
      };
    });
    refreshGrammarPaths(returnTo);
    redirect(returnTo);
  }

  const accessible = await hasGrammarAccess(supabase, grammarId);

  if (!accessible) {
    redirect(returnTo);
  }

  const { data: existing } = await supabase
    .from("user_bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("content_type", "grammar")
    .eq("grammar_id", grammarId)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("user_bookmarks").delete().eq("id", existing.id).eq("user_id", user.id);
  } else {
    await supabase.from("user_bookmarks").insert({
      user_id: user.id,
      content_type: "grammar",
      grammar_id: grammarId
    });
  }

  refreshGrammarPaths(returnTo);
  redirect(returnTo);
}

export async function setGrammarStatusAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const grammarId = getGrammarId(formData);
  const returnTo = safeRedirectPath(formData.get("return_to"), "/grammar");
  const previewPlan = normalizePreviewPlan(getFormString(formData, "plan"));
  const status = normalizeStatus(getFormString(formData, "status"));

  if (!grammarId || !status) {
    redirect(returnTo);
  }

  const masteryScore = status === "completed" ? 100 : status === "in_progress" ? 35 : 0;
  const nextReviewAt = status === "completed" ? nextReviewDate(7) : status === "in_progress" ? nextReviewDate(1) : null;

  if (!supabase) {
    await updatePreviewGrammarState(grammarId, previewPlan, (state) => {
      state[grammarId] = {
        ...state[grammarId],
        status,
        masteryScore,
        nextReviewAt
      };
    });
    refreshGrammarPaths(returnTo);
    redirect(returnTo);
  }

  const accessible = await hasGrammarAccess(supabase, grammarId);

  if (!accessible) {
    redirect(returnTo);
  }

  await supabase.from("user_grammar").upsert(
    {
      user_id: user.id,
      grammar_id: grammarId,
      status,
      mastery_score: masteryScore,
      last_studied_at: new Date().toISOString(),
      next_review_at: nextReviewAt
    },
    { onConflict: "user_id,grammar_id" }
  );

  refreshGrammarPaths(returnTo);
  redirect(returnTo);
}

export async function addGrammarToReviewAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const grammarId = getGrammarId(formData);
  const returnTo = safeRedirectPath(formData.get("return_to"), "/grammar");
  const previewPlan = normalizePreviewPlan(getFormString(formData, "plan"));

  if (!grammarId) {
    redirect(returnTo);
  }

  if (!supabase) {
    await updatePreviewGrammarState(grammarId, previewPlan, (state) => {
      state[grammarId] = {
        ...state[grammarId],
        status: "in_progress",
        masteryScore: Math.max(state[grammarId]?.masteryScore ?? 0, 45),
        nextReviewAt: new Date().toISOString()
      };
    });
    refreshGrammarPaths(returnTo);
    redirect(returnTo);
  }

  const accessible = await hasGrammarAccess(supabase, grammarId);

  if (!accessible) {
    redirect(returnTo);
  }

  await supabase.from("user_grammar").upsert(
    {
      user_id: user.id,
      grammar_id: grammarId,
      status: "in_progress",
      mastery_score: 45,
      last_studied_at: new Date().toISOString(),
      next_review_at: new Date().toISOString()
    },
    { onConflict: "user_id,grammar_id" }
  );

  refreshGrammarPaths(returnTo);
  redirect(returnTo);
}

async function updatePreviewGrammarState(
  grammarId: string,
  previewPlan: "free" | "pro" | undefined,
  updater: (state: PreviewGrammarState) => void
) {
  const entry = grammarEntries.find((item) => item.id === grammarId);

  if (!entry) {
    return;
  }

  const accountTier = await getAccountTier(null, { id: "preview" } as never, previewPlan);

  if (!canAccessGrammar(entry, accountTier)) {
    return;
  }

  const state = await readPreviewGrammarState();
  updater(state);
  await writePreviewGrammarState(state);
}

async function hasGrammarAccess(supabase: NonNullable<Awaited<ReturnType<typeof requireUser>>["supabase"]>, grammarId: string) {
  const { data, error } = await supabase.from("grammar").select("id").eq("id", grammarId).maybeSingle();

  return !error && Boolean(data?.id);
}

function getGrammarId(formData: FormData) {
  const value = getFormString(formData, "grammar_id");

  return uuidPattern.test(value) ? value : "";
}

function normalizeStatus(value: string): GrammarProgressStatus | null {
  return allowedStatuses.has(value as GrammarProgressStatus) ? (value as GrammarProgressStatus) : null;
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function nextReviewDate(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function refreshGrammarPaths(returnTo: string) {
  const path = returnTo.split("?")[0] || "/grammar";

  revalidatePath("/grammar");
  revalidatePath(path);
}
