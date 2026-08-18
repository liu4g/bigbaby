"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canAccess, normalizePreviewPlan } from "@/lib/access-control";
import { getUserProfile, requireUser, safeRedirectPath } from "@/lib/auth";
import {
  buildDefaultDailyTasks,
  completionAccuracyForTask,
  getTodayDateKey,
  normalizeDailyTaskType,
  readPreviewLearningState,
  sessionTypeForTask,
  writePreviewLearningState
} from "@/lib/learning";

export async function completeDailyTaskAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const previewPlan = normalizePreviewPlan(getFormString(formData, "plan"));
  const profile = await getUserProfile(supabase, user);
  const taskType = normalizeDailyTaskType(formData.get("task_type"));
  const returnTo = safeRedirectPath(formData.get("return_to"), "/dashboard");

  if (!taskType) {
    redirect(returnTo);
  }

  const allowed = await canAccess(user, { kind: "feature", feature: "study_plan" }, { supabase, previewPlan });

  if (!allowed) {
    redirect(returnTo);
  }

  const todayKey = getTodayDateKey(profile.timezone);
  const template = buildDefaultDailyTasks(profile, todayKey).find((task) => task.taskType === taskType);

  if (!template) {
    redirect(returnTo);
  }

  const accuracy = completionAccuracyForTask(taskType);

  if (!supabase) {
    const state = await readPreviewLearningState();

    await writePreviewLearningState({
      taskDate: todayKey,
      tasks: {
        ...(state.taskDate === todayKey ? state.tasks : {}),
        [taskType]: {
          completedCount: template.targetCount,
          completedMinutes: template.targetMinutes,
          status: "completed",
          accuracy
        }
      }
    });
    refreshLearningPaths(returnTo);
    redirect(returnTo);
  }

  const { data: existing } = await supabase
    .from("daily_study_tasks")
    .select(
      "id,title,description,target_level,target_count,completed_count,target_minutes,completed_minutes,status,href"
    )
    .eq("user_id", user.id)
    .eq("task_date", todayKey)
    .eq("task_type", taskType)
    .maybeSingle();

  const targetCount = Math.max(Number(existing?.target_count ?? template.targetCount), 1);
  const targetMinutes = Math.max(Number(existing?.target_minutes ?? template.targetMinutes), 1);
  const alreadyCompleted = existing?.status === "completed";

  await supabase.from("daily_study_tasks").upsert(
    {
      user_id: user.id,
      task_date: todayKey,
      task_type: taskType,
      title: existing?.title ?? template.title,
      description: existing?.description ?? template.description,
      target_level: existing?.target_level ?? template.targetLevel,
      target_count: targetCount,
      completed_count: targetCount,
      target_minutes: targetMinutes,
      completed_minutes: targetMinutes,
      status: "completed",
      accuracy,
      href: existing?.href ?? template.href,
      source_type: "manual"
    },
    { onConflict: "user_id,task_date,task_type" }
  );

  if (!alreadyCompleted) {
    const startedAt = new Date();
    const endedAt = new Date(startedAt.getTime() + targetMinutes * 60 * 1000);
    const correctCount = Math.round((targetCount * accuracy) / 100);

    await supabase.from("study_sessions").insert({
      user_id: user.id,
      session_type: sessionTypeForTask(taskType),
      target_level: existing?.target_level ?? template.targetLevel,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_seconds: targetMinutes * 60,
      items_completed: targetCount,
      correct_count: correctCount,
      incorrect_count: Math.max(targetCount - correctCount, 0),
      notes: existing?.title ?? template.title,
      session_summary: {
        task_type: taskType,
        source: "daily_study_plan",
        accuracy
      }
    });
  }

  refreshLearningPaths(returnTo);
  redirect(returnTo);
}

function refreshLearningPaths(returnTo: string) {
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  revalidatePath(returnTo.split("?")[0] || "/dashboard");
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
