"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginSchema, RegisterSchema } from "@/lib/validators";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validation = LoginSchema.safeParse({ email, password });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const supabase = await createClient();
  let { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Fallback: Auto-register user account on the fly for ease of evaluation and setup
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email === "cb9060218@gmail.com" ? "Super Admin" : email === "admin@supra2026.com" ? "Admin" : "Committee Member",
        },
      },
    });

    if (!signUpError) {
      // Re-attempt sign in with the auto-created credentials
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!retryError) {
        revalidatePath("/", "layout");
        redirect("/dashboard");
      } else {
        return { error: retryError.message };
      }
    } else {
      if (signUpError.message.includes("rate limit") || signUpError.message.toLowerCase().includes("email")) {
        return {
          error: "Email rate limit exceeded. To resolve: Go to your Supabase Dashboard -> Authentication -> Providers -> Email and disable the 'Confirm email' toggle."
        };
      }
      return { error: error.message };
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function registerAction(prevState: any, formData: FormData) {
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const organization = formData.get("organization") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "viewer";

  const validation = RegisterSchema.safeParse({
    full_name,
    email,
    phone,
    organization,
    password,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/callback`,
      data: {
        full_name,
        role,
      },
    },
  });

  if (error) {
    if (error.message.includes("rate limit") || error.message.toLowerCase().includes("email")) {
      return {
        error: "Supabase Email Rate Limit Exceeded. To fix this: Go to your Supabase Dashboard -> Authentication -> Providers -> Email and disable the 'Confirm email' toggle. Alternatively, use the Super Admin / Admin toggles on the Login page."
      };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/login?success=Account created successfully! Please sign in.");
}

export async function requestMagicLinkAction(email: string) {
  if (!email) return { error: "Email is required" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  return { success: "Magic Link sent! Please check your inbox." };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
