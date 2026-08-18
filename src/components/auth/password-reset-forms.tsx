"use client";

import { useActionState } from "react";
import { KeyRound, Mail } from "lucide-react";
import {
  requestPasswordResetAction,
  updatePasswordAction,
  type ActionState
} from "@/app/actions/auth";
import { SubmitButton, FormMessage } from "@/components/auth/form-controls";
import { Input } from "@/components/ui/input";

const initialState: ActionState = { status: "idle" };

export function PasswordResetRequestForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          注册邮箱
        </label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
      </div>

      <SubmitButton pendingText="发送中..." className="w-full">
        <Mail className="h-4 w-4" />
        发送密码重置邮件
      </SubmitButton>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          新密码
        </label>
        <Input id="password" name="password" type="password" placeholder="至少 8 位" autoComplete="new-password" required minLength={8} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="confirm_password">
          确认新密码
        </label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          placeholder="再次输入新密码"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>

      <SubmitButton pendingText="更新中..." className="w-full">
        <KeyRound className="h-4 w-4" />
        更新密码
      </SubmitButton>
    </form>
  );
}
