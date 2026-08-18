import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "注册",
  description: "注册 JAPANWEB，创建你的日语学习账号。"
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="创建一条属于你的 JLPT 学习路径。"
      description="注册时设置当前水平、目标等级和每日学习目标，Dashboard 会根据这些资料展示学习状态。"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Register</p>
          <h2 className="text-2xl font-semibold tracking-tight">创建账号</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            新用户默认 FREE 权限，PRO 权限后续通过订阅系统开启。
          </p>
        </div>

        <RegisterForm />
      </div>
    </AuthShell>
  );
}
