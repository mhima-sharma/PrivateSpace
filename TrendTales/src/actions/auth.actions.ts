"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { ok, fail, type ActionResult } from "@/actions/types";

export async function loginAction(
  email: string,
  password: string
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) return fail("Invalid email or password");

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return ok();
  } catch (error) {
    if (error instanceof AuthError) {
      return fail("Invalid email or password");
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
