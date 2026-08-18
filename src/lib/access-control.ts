import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isAuthPreviewEnabled } from "@/lib/auth";
import type { Level } from "@/lib/site";

export type AccountTier = "free" | "pro";

export type AccessContentResource = {
  kind: "content";
  module: "vocabulary" | "grammar" | "reading" | "practice" | "jlpt";
  level: Level;
  accessTier?: AccountTier;
};

export type AccessFeatureResource = {
  kind: "feature";
  feature: "wrong_answers" | "learning_records" | "study_plan";
};

export type AccessSubscriptionResource = {
  kind: "subscription";
  ownerId?: string;
};

export type AccessResource = AccessContentResource | AccessFeatureResource | AccessSubscriptionResource;

export type AccessCheckOptions = {
  supabase: SupabaseClient | null;
  previewPlan?: AccountTier;
};

const freeContentLevels = new Set<Level>(["N5", "N4", "N3"]);

export function normalizePreviewPlan(value: string | string[] | undefined): AccountTier | undefined {
  if (!isAuthPreviewEnabled()) {
    return undefined;
  }

  const candidate = Array.isArray(value) ? value[0] : value;

  return candidate === "free" || candidate === "pro" ? candidate : undefined;
}

export async function getAccountTier(supabase: SupabaseClient | null, user: User, previewPlan?: AccountTier): Promise<AccountTier> {
  if (!supabase || isAuthPreviewEnabled()) {
    return previewPlan ?? (process.env.AUTH_PREVIEW_PLAN === "free" ? "free" : "pro");
  }

  const { data, error } = await supabase
    .from("subscription_access")
    .select("subscription,subscription_status,subscription_start,subscription_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    const { data: legacyData } = await supabase
      .from("subscriptions")
      .select("tier,status,current_period_start,current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    return isProSubscription({
      subscription: legacyData?.tier ?? "free",
      subscription_status: legacyData?.status ?? "inactive",
      subscription_start: legacyData?.current_period_start ?? null,
      subscription_end: legacyData?.current_period_end ?? null
    })
      ? "pro"
      : "free";
  }

  return isProSubscription(data)
    ? "pro"
    : "free";
}

export function canAccessByTier(accountTier: AccountTier, resource: AccessResource, userId?: string) {
  switch (resource.kind) {
    case "subscription":
      return !resource.ownerId || resource.ownerId === userId;
    case "feature":
      return resource.feature === "wrong_answers" || resource.feature === "learning_records" || resource.feature === "study_plan"
        ? accountTier === "pro"
        : false;
    case "content":
      return canAccessContent(accountTier, resource.level, resource.accessTier ?? "free");
  }
}

export async function canAccess(user: User, resource: AccessResource, options: AccessCheckOptions) {
  const accountTier = await getAccountTier(options.supabase, user, options.previewPlan);

  return canAccessByTier(accountTier, resource, user.id);
}

export function canAccessContent(accountTier: AccountTier, level: Level, accessTier: AccountTier = "free") {
  if (accessTier === "pro") {
    return accountTier === "pro";
  }

  return freeContentLevels.has(level) || accountTier === "pro";
}

export function canAccessFeature(accountTier: AccountTier, feature: AccessFeatureResource["feature"]) {
  switch (feature) {
    case "wrong_answers":
    case "learning_records":
    case "study_plan":
      return accountTier === "pro";
  }
}

function isProSubscription(value: {
  subscription?: string | null;
  subscription_status?: string | null;
  subscription_start?: string | null;
  subscription_end?: string | null;
} | null | undefined) {
  if (!value) {
    return false;
  }

  const subscription = value.subscription === "pro" ? "pro" : "free";
  const status = typeof value.subscription_status === "string" ? value.subscription_status : "";
  const subscriptionEnd = typeof value.subscription_end === "string" ? value.subscription_end : null;
  const periodActive = !subscriptionEnd || new Date(subscriptionEnd).getTime() >= Date.now();

  return subscription === "pro" && ["active", "trialing"].includes(status) && periodActive;
}
