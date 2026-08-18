import type { Metadata } from "next";
import { KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { ProfileForm } from "@/components/auth/profile-form";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserProfile, requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "个人中心",
  description: "管理 JAPANWEB 账号、学习目标和登录状态。"
};

type SubscriptionAccessRow = {
  subscription: "free" | "pro";
  subscription_status: string;
  subscription_start: string | null;
  subscription_end: string | null;
};

const previewSubscription: SubscriptionAccessRow = {
  subscription: "pro",
  subscription_status: "active",
  subscription_start: null,
  subscription_end: null
};

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user);
  const subscription = await getSubscriptionAccess(supabase, user);
  const plan = subscription.subscription.toUpperCase();
  const statusTone = isActiveSubscription(subscription.subscription, subscription.subscription_status) ? "success" : "outline";

  return (
    <Section>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Account"
          title="个人中心"
          description="这些资料会影响 Dashboard、学习计划和后续 JLPT 推荐内容。"
          actions={
            <>
              <Button href="/reset-password" variant="outline" leadingIcon={<KeyRound className="h-4 w-4" />}>
                修改密码
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="destructive" leadingIcon={<LogOut className="h-4 w-4" />}>
                  退出登录
                </Button>
              </form>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="h-4 w-4 text-primary" />
                  账号信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      profile.nickname.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{profile.nickname}</p>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                    <span className="text-muted-foreground">当前水平</span>
                    <span className="font-medium">{profile.jlpt_level}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                    <span className="text-muted-foreground">目标等级</span>
                    <span className="font-medium">{profile.target_jlpt_level}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                    <span className="text-muted-foreground">每日目标</span>
                    <span className="font-medium">{profile.daily_study_goal} 分钟</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                    <span className="text-muted-foreground">时区</span>
                    <span className="font-medium">{profile.timezone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  订阅状态
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                  <span className="text-muted-foreground">当前套餐</span>
                  <Badge variant={plan === "PRO" ? "accent" : "outline"}>{plan}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                  <span className="text-muted-foreground">订阅状态</span>
                  <Badge variant={statusTone}>{subscription.subscription_status}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                  <span className="text-muted-foreground">订阅开始</span>
                  <span className="font-medium">{formatSubscriptionDate(subscription.subscription_start)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                  <span className="text-muted-foreground">订阅结束</span>
                  <span className="font-medium">{formatSubscriptionDate(subscription.subscription_end)}</span>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  这里先保留订阅状态视图，后续接 Stripe 时只需要把这几列同步即可。
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">学习资料</CardTitle>
              <p className="text-sm text-muted-foreground">保存后会影响推荐内容、每日目标和学习计划。</p>
            </CardHeader>
            <CardContent>
              <ProfileForm profile={profile} />
            </CardContent>
          </Card>
        </div>
      </div>
    </Section>
  );
}

async function getSubscriptionAccess(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], user: Awaited<ReturnType<typeof requireUser>>["user"]): Promise<SubscriptionAccessRow> {
  if (!supabase) {
    return previewSubscription;
  }

  const { data, error } = await supabase
    .from("subscription_access")
    .select("subscription,subscription_status,subscription_start,subscription_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return {
      subscription: "free",
      subscription_status: "inactive",
      subscription_start: null,
      subscription_end: null
    };
  }

  return normalizeSubscriptionAccess(data as Partial<SubscriptionAccessRow>);
}

function normalizeSubscriptionAccess(row: Partial<SubscriptionAccessRow>): SubscriptionAccessRow {
  return {
    subscription: row.subscription === "pro" ? "pro" : "free",
    subscription_status: typeof row.subscription_status === "string" ? row.subscription_status : "inactive",
    subscription_start: typeof row.subscription_start === "string" ? row.subscription_start : null,
    subscription_end: typeof row.subscription_end === "string" ? row.subscription_end : null
  };
}

function isActiveSubscription(subscription: SubscriptionAccessRow["subscription"], status: string) {
  return subscription === "pro" && ["active", "trialing"].includes(status);
}

function formatSubscriptionDate(value: string | null) {
  if (!value) {
    return "未开通";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}
