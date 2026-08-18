"use client";

import { useActionState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { registerAction, type ActionState } from "@/app/actions/auth";
import { SubmitButton, FormMessage } from "@/components/auth/form-controls";
import { Input, Select } from "@/components/ui/input";

const initialState: ActionState = { status: "idle" };

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="nickname">
          昵称
        </label>
        <Input id="nickname" name="nickname" type="text" placeholder="你的名字" autoComplete="name" required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          邮箱
        </label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            密码
          </label>
          <Input id="password" name="password" type="password" placeholder="至少 8 位" autoComplete="new-password" required minLength={8} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="confirm_password">
            确认密码
          </label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            placeholder="再次输入密码"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="jlpt_level">
            当前 JLPT 水平
          </label>
          <Select id="jlpt_level" name="jlpt_level" defaultValue="N5">
            <option value="N5">N5</option>
            <option value="N4">N4</option>
            <option value="N3">N3</option>
            <option value="N2">N2</option>
            <option value="N1">N1</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="target_jlpt_level">
            目标 JLPT
          </label>
          <Select id="target_jlpt_level" name="target_jlpt_level" defaultValue="N3">
            <option value="N5">N5</option>
            <option value="N4">N4</option>
            <option value="N3">N3</option>
            <option value="N2">N2</option>
            <option value="N1">N1</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="daily_study_goal">
            每日目标（分钟）
          </label>
          <Input id="daily_study_goal" name="daily_study_goal" type="number" min={5} max={480} defaultValue={30} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="timezone">
            时区
          </label>
          <Input id="timezone" name="timezone" type="text" defaultValue="Asia/Tokyo" required />
        </div>
      </div>

      <SubmitButton pendingText="创建中..." className="w-full">
        <UserPlus className="h-4 w-4" />
        创建账号
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        已有账号？{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          直接登录
        </Link>
      </p>
    </form>
  );
}
