import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("is_verified")
      .eq("id", user.id)
      .single();

    if (profile?.is_verified) {
      redirect("/dashboard");
    } else {
      redirect("/pending");
    }
  } else {
    redirect("/login");
  }

  return null;
}
