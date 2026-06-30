import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div style={{ backgroundColor: "#FAF8F4", minHeight: "100vh" }}>
      <Header />
      <Sidebar />
      <main
        className="pt-16 pl-56 min-h-screen"
        style={{ backgroundColor: "#FAF8F4" }}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
