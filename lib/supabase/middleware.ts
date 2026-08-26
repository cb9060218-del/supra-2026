import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Retrieve current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Protect dashboard routes
  if (path.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Retrieve database profile details
    let { data: profile } = await supabase
      .from("users")
      .select("is_verified, role, is_active")
      .eq("id", user.id)
      .single();

    const { data: existingUsers } = await supabase
      .from("users")
      .select("id");
    
    const isFirst = !existingUsers || existingUsers.length === 0;

    const metaRole = user.user_metadata?.role || "viewer";
    let userRole = metaRole;
    let isVerified = true;
    let isFounder = metaRole === "super_admin" || user.email === "cb9060218@gmail.com" || isFirst;

    if (!profile) {
      // Self-healing: Create the missing public profile if it was not created by the trigger
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || (userRole === "super_admin" ? "Super Admin" : userRole === "admin" ? "Admin" : "Committee Member"),
          email: user.email!,
          role: userRole,
          is_verified: isVerified,
          is_active: true,
          is_founder: isFounder,
        });

      if (insertError) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "Profile auto-creation failed: " + insertError.message);
        return NextResponse.redirect(url);
      }

      // Re-fetch profile
      const { data: newProfile } = await supabase
        .from("users")
        .select("is_verified, role, is_active")
        .eq("id", user.id)
        .single();
      profile = newProfile;
    } else {
      // Self-healing: If profile exists but is not verified, or has wrong role, correct the database record!
      if (
        (isVerified && !profile.is_verified) ||
        (userRole !== "viewer" && profile.role !== userRole)
      ) {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            role: userRole,
            is_verified: true,
            is_founder: isFounder,
          })
          .eq("id", user.id);

        if (!updateError) {
          profile.role = userRole;
          profile.is_verified = true;
        }
      }
    }

    if (!profile) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "Profile creation failed.");
      return NextResponse.redirect(url);
    }

    if (!profile.is_active) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "Your account is suspended.");
      return NextResponse.redirect(url);
    }

    if (!profile.is_verified) {
      if (path !== "/pending") {
        const url = request.nextUrl.clone();
        url.pathname = "/pending";
        return NextResponse.redirect(url);
      }
    } else {
      // User is verified, cannot access pending page
      if (path === "/pending") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }

    // Role Route Authorization:
    // /dashboard/users and /dashboard/logs require super_admin
    if (path.startsWith("/dashboard/users") && profile.role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (path.startsWith("/dashboard/logs") && profile.role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

  }

  // Handle pending verification redirect logic outside dashboard
  if (path === "/pending") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    const { data: profile } = await supabase
      .from("users")
      .select("is_verified")
      .eq("id", user.id)
      .single();

    if (profile?.is_verified) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in and verified users hitting auth routes
  if (user && (path === "/login" || path === "/register" || path === "/")) {
    const { data: profile } = await supabase
      .from("users")
      .select("is_verified")
      .eq("id", user.id)
      .single();

    if (profile) {
      const url = request.nextUrl.clone();
      if (profile.is_verified) {
        url.pathname = "/dashboard";
      } else {
        url.pathname = "/pending";
      }
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
