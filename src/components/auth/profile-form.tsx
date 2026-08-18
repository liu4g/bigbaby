"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateProfileAction, type ActionState } from "@/app/actions/auth";
import type { UserProfile } from "@/lib/auth";
import { SubmitButton, FormMessage } from "@/components/auth/form-controls";
import { Input, Select } from "@/components/ui/input";

const initialState: ActionState = { status: "idle" };

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const [state, formAction] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="nickname">
            昵称
          </label>
          <Input id="nickname" name="nickname" defaultValue={profile.nickname} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="avatar_url">
            头像 URL
          </label>
          <Input id="avatar_url" name="avatar_url" type="url" defaultValue={profile.avatar_url ?? ""} placeholder="https://..." />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="jlpt_level">
            当前 JLPT 水平
          </label>
          <Select id="jlpt_level" name="jlpt_level" defaultValue={profile.jlpt_level}>
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
          <Select id="target_jlpt_level" name="target_jlpt_level" defaultValue={profile.target_jlpt_level}>
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
            每日学习目标（分钟）
          </label>
          <Input
            id="daily_study_goal"
            name="daily_study_goal"
            type="number"
            min={5}
            max={480}
            defaultValue={profile.daily_study_goal}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="timezone">
            时区
          </label>
          <Input id="timezone" name="timezone" defaultValue={profile.timezone} required />
        </div>
      </div>

      <SubmitButton pendingText="保存中...">
        <Save className="h-4 w-4" />
        保存资料
      </SubmitButton>
    </form>
  );
}
