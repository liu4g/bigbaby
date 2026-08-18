"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getFormString,
  isAuthPreviewEnabled,
  normalizeLevel,
  normalizeStudyGoal,
  requireUser,
  safeRedirectPath
} from "@/lib/auth";
import { getOptionalSupabaseEnv, getSiteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const initialError: ActionState = {
  status: "error",
  message: "请求失败，请稍后再试。"
};

async function getRequestOrigin() {
  const configuredSiteUrl = getSiteUrl();

  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function envReadyError() {
  if (getOptionalSupabaseEnv()) {
    return null;
  }

  return {
    status: "error" as const,
    message: "Supabase 环境变量还没有配置，请先填写 .env.local。"
  };
}

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const envError = envReadyError();
  if (envError) return envError;

  const email = getFormString(formData, "email").toLowerCase();
  const password = getFormString(formData, "password");
  const next = safeRedirectPath(formData.get("next"));

  if (!validateEmail(email) || password.length < 6) {
    return {
      status: "error",
      message: "请输入有效邮箱和至少 6 位密码。"
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const errorText = `${error.name} ${error.message}`.toLowerCase();
    const isNetworkError =
      errorText.includes("fetch") ||
      errorText.includes("network") ||
      errorText.includes("econnrefused") ||
      errorText.includes("failed to send request");

    if (isNetworkError) {
      return {
        status: "error",
        message: "本地 Supabase 服务还没有启动，请先启动数据库后再登录 demo 账号。"
      };
    }

    return {
      status: "error",
      message: "邮箱或密码不正确。"
    };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function registerAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const envError = envReadyError();
  if (envError) return envError;

  const nickname = getFormString(formData, "nickname");
  const email = getFormString(formData, "email").toLowerCase();
  const password = getFormString(formData, "password");
  const confirmPassword = getFormString(formData, "confirm_password");
  const jlptLevel = normalizeLevel(formData.get("jlpt_level"), "N5");
  const targetJlptLevel = normalizeLevel(formData.get("target_jlpt_level"), "N3");
  const dailyStudyGoal = normalizeStudyGoal(formData.get("daily_study_goal"), 30);
  const timezone = getFormString(formData, "timezone", "Asia/Tokyo") || "Asia/Tokyo";

  if (!nickname || !validateEmail(email) || password.length < 8) {
    return {
      status: "error",
      message: "请填写昵称、有效邮箱和至少 8 位密码。"
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "两次输入的密码不一致。"
    };
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      data: {
        nickname,
        display_name: nickname,
        jlpt_level: jlptLevel,
        target_level: targetJlptLevel,
        target_jlpt_level: targetJlptLevel,
        study_goal_minutes: dailyStudyGoal,
        daily_study_goal: dailyStudyGoal,
        timezone
      }
    }
  });

  if (error) {
    return {
      status: "error",
      message: "注册失败，请检查邮箱是否已被使用。"
    };
  }

  if (data.user && data.session) {
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        display_name: nickname,
        nickname,
        jlpt_level: jlptLevel,
        target_level: targetJlptLevel,
        target_jlpt_level: targetJlptLevel,
        study_goal_minutes: dailyStudyGoal,
        daily_study_goal: dailyStudyGoal,
        timezone
      },
      { onConflict: "id" }
    );

    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return {
    status: "success",
    message: "注册邮件已发送，请在邮箱中确认账号后登录。"
  };
}

export async function logoutAction() {
  if (isAuthPreviewEnabled()) {
    revalidatePath("/", "layout");
    redirect("/login?message=logged-out");
  }

  const env = getOptionalSupabaseEnv();

  if (env) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login?message=logged-out");
}

export async function requestPasswordResetAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const envError = envReadyError();
  if (envError) return envError;

  const email = getFormString(formData, "email").toLowerCase();

  if (!validateEmail(email)) {
    return {
      status: "error",
      message: "请输入有效邮箱。"
    };
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password?mode=update`
  });

  if (error) {
    return initialError;
  }

  return {
    status: "success",
    message: "如果该邮箱已注册，我们会发送密码重置链接。"
  };
}

export async function updatePasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const envError = envReadyError();
  if (envError) return envError;

  const password = getFormString(formData, "password");
  const confirmPassword = getFormString(formData, "confirm_password");

  if (password.length < 8) {
    return {
      status: "error",
      message: "新密码至少需要 8 位。"
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "两次输入的密码不一致。"
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "重置链接已失效，请重新发送密码重置邮件。"
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return initialError;
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?message=password-updated");
}

export async function updateProfileAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  if (!supabase || isAuthPreviewEnabled()) {
    return {
      status: "success",
      message: "当前是登录后预览模式，资料不会写入数据库。"
    };
  }

  const nickname = getFormString(formData, "nickname");
  const avatarUrl = getFormString(formData, "avatar_url") || null;
  const jlptLevel = normalizeLevel(formData.get("jlpt_level"), "N5");
  const targetJlptLevel = normalizeLevel(formData.get("target_jlpt_level"), "N3");
  const dailyStudyGoal = normalizeStudyGoal(formData.get("daily_study_goal"), 30);
  const timezone = getFormString(formData, "timezone", "Asia/Tokyo") || "Asia/Tokyo";

  if (!nickname) {
    return {
      status: "error",
      message: "昵称不能为空。"
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: nickname,
      nickname,
      avatar_url: avatarUrl,
      jlpt_level: jlptLevel,
      target_level: targetJlptLevel,
      target_jlpt_level: targetJlptLevel,
      study_goal_minutes: dailyStudyGoal,
      daily_study_goal: dailyStudyGoal,
      timezone
    })
    .eq("id", user.id);

  if (error) {
    return initialError;
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return {
    status: "success",
    message: "个人资料已更新。"
  };
}
