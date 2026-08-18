import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOptionalSupabaseEnv } from "@/lib/supabase/env";
import { levels, type Level } from "@/lib/site";

export type UserProfile = {
  id: string;
  nickname: string;
  display_name: string;
  avatar_url: string | null;
  jlpt_level: Level;
  target_level: Level;
  target_jlpt_level: Level;
  daily_study_goal: number;
  study_goal_minutes: number;
  timezone: string;
  role: string;
};

const levelSet = new Set<string>(levels);

export function isAuthPreviewEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.AUTH_PREVIEW_MODE === "true";
}

export const previewUser = {
  id: "22222222-2222-2222-2222-222222222222",
  email: "demo.pro@japanweb.local",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {
    nickname: "Ren Pro",
    display_name: "Ren Pro"
  },
  aud: "authenticated",
  created_at: new Date().toISOString()
} as User;

export const previewProfile: UserProfile = {
  id: previewUser.id,
  nickname: "Ren Pro",
  display_name: "Ren Pro",
  avatar_url: null,
  jlpt_level: "N3",
  target_level: "N2",
  target_jlpt_level: "N2",
  daily_study_goal: 45,
  study_goal_minutes: 45,
  timezone: "Asia/Tokyo",
  role: "student"
};

export function safeRedirectPath(value: FormDataEntryValue | string | null | undefined, fallback = "/dashboard") {
  if (typeof value !== "string") {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/auth/callback")) {
    return fallback;
  }

  return value;
}

export function normalizeLevel(value: FormDataEntryValue | string | null | undefined, fallback: Level): Level {
  return typeof value === "string" && levelSet.has(value) ? (value as Level) : fallback;
}

export function normalizeStudyGoal(value: FormDataEntryValue | string | number | null | undefined, fallback = 30) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 5), 480);
}

export function getFormString(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : fallback;
}

export async function requireUser() {
  if (isAuthPreviewEnabled()) {
    return { supabase: null, user: previewUser, isPreview: true };
  }

  if (!getOptionalSupabaseEnv()) {
    redirect("/login?message=supabase-config-required");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return { supabase, user, isPreview: false };
}

export function defaultProfile(user: User): UserProfile {
  const fallbackName = user.email?.split("@")[0] || "Learner";

  return {
    id: user.id,
    nickname: fallbackName,
    display_name: fallbackName,
    avatar_url: null,
    jlpt_level: "N5",
    target_level: "N3",
    target_jlpt_level: "N3",
    daily_study_goal: 30,
    study_goal_minutes: 30,
    timezone: "Asia/Tokyo",
    role: "student"
  };
}

export function normalizeProfile(row: Partial<UserProfile> | null | undefined, user: User): UserProfile {
  const fallback = defaultProfile(user);

  if (!row) {
    return fallback;
  }

  return {
    ...fallback,
    ...row,
    nickname: row.nickname || row.display_name || fallback.nickname,
    display_name: row.display_name || row.nickname || fallback.display_name,
    avatar_url: row.avatar_url ?? null,
    jlpt_level: normalizeLevel(row.jlpt_level, fallback.jlpt_level),
    target_level: normalizeLevel(row.target_level, fallback.target_level),
    target_jlpt_level: normalizeLevel(row.target_jlpt_level ?? row.target_level, fallback.target_jlpt_level),
    daily_study_goal: normalizeStudyGoal(row.daily_study_goal ?? row.study_goal_minutes, fallback.daily_study_goal),
    study_goal_minutes: normalizeStudyGoal(row.study_goal_minutes ?? row.daily_study_goal, fallback.study_goal_minutes),
    timezone: row.timezone || fallback.timezone,
    role: row.role || fallback.role
  };
}

export async function getUserProfile(supabase: SupabaseClient | null, user: User) {
  if (!supabase || isAuthPreviewEnabled()) {
    return previewProfile;
  }

  const { data } = await supabase
    .from("profiles")
    .select(
      "id,nickname,display_name,avatar_url,jlpt_level,target_level,target_jlpt_level,daily_study_goal,study_goal_minutes,timezone,role"
    )
    .eq("id", user.id)
    .maybeSingle();

  return normalizeProfile(data as Partial<UserProfile> | null, user);
}
