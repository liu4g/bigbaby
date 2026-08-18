import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "登录",
  description: "登录 JAPANWEB，继续你的日语学习进度。"
};

function getNotice(message?: string) {
  switch (message) {
    case "logged-out":
      return "你已安全退出。";
    case "password-updated":
      return "密码已更新，请使用新密码登录。";
    case "auth-callback-error":
      return "登录链接已失效，请重新操作。";
    case "supabase-config-required":
      return "Supabase 环境变量尚未配置，受保护页面暂时无法访问。";
    default:
      return null;
  }
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; message?: string }>;
}) {
  const params = await searchParams;
  const notice = getNotice(params.message);

  return (
    <AuthShell
      title="欢迎回来，继续今天的学习。"
      description="登录后可以查看专属 Dashboard、学习记录、收藏、复习计划和会员权限状态。"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Login</p>
          <h2 className="text-2xl font-semibold tracking-tight">登录账号</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            登录后继续查看你的学习进度、复习任务和目标等级。
          </p>
        </div>

        {notice ? (
          <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            {notice}
          </div>
        ) : null}

        <LoginForm nextPath={params.next} />
      </div>
    </AuthShell>
  );
}
