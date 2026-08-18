import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";
import { PasswordResetRequestForm, UpdatePasswordForm } from "@/components/auth/password-reset-forms";
import { createClient } from "@/lib/supabase/server";
import { getOptionalSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "重置密码",
  description: "通过邮箱重置 JAPANWEB 账号密码。"
};

export default async function ResetPasswordPage() {
  let hasSession = false;

  if (getOptionalSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    hasSession = !!user;
  }

  return (
    <AuthShell
      title={hasSession ? "设置你的新密码。" : "找回你的账号访问权限。"}
      description={
        hasSession
          ? "重置邮件链接已验证，现在可以安全更新密码。"
          : "输入注册邮箱后，我们会发送一封密码重置邮件。"
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Password Reset</p>
          <h2 className="text-2xl font-semibold tracking-tight">
            {hasSession ? "更新密码" : "发送重置邮件"}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {hasSession
              ? "更新成功后会自动退出，请使用新密码重新登录。"
              : "如果邮箱存在，系统会发送重置链接。为了安全，不会暴露账号是否注册。"}
          </p>
        </div>

        {hasSession ? <UpdatePasswordForm /> : <PasswordResetRequestForm />}

        <p className="text-center text-sm text-muted-foreground">
          想起来了？{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            返回登录
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
