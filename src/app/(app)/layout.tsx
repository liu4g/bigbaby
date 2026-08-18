import { AppShell } from "@/components/layout/app-shell";
import { logoutAction } from "@/app/actions/auth";
import { getUserProfile, requireUser } from "@/lib/auth";

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user);

  return (
    <AppShell
      user={{
        email: user.email ?? "",
        nickname: profile.nickname,
        avatarUrl: profile.avatar_url,
        targetLevel: profile.target_jlpt_level
      }}
      signOutAction={logoutAction}
    >
      {children}
    </AppShell>
  );
}
