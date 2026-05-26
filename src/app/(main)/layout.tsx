import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, is_admin")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header user={profile} isAdmin={!!profile?.is_admin} />
      <main className="flex-1 pb-20">
        <div className="mx-auto max-w-lg px-4 py-4">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
