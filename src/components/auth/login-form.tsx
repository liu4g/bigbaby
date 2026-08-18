"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { loginAction, type ActionState } from "@/app/actions/auth";
import { SubmitButton, FormMessage } from "@/components/auth/form-controls";
import { Input } from "@/components/ui/input";

const initialState: ActionState = { status: "idle" };

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath || "/dashboard"} />

      <FormMessage state={state} />

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          邮箱
        </label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          密码
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="输入密码"
          autoComplete="current-password"
          required
          minLength={6}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <Link href="/reset-password" className="font-medium text-primary hover:underline">
          忘记密码？
        </Link>
        <Link href="/register" className="font-medium text-primary hover:underline">
          创建账号
        </Link>
      </div>

      <SubmitButton pendingText="登录中..." className="w-full">
        <LogIn className="h-4 w-4" />
        登录并进入学习首页
      </SubmitButton>
    </form>
  );
}
