"use server";

import { redirect } from "next/navigation";

import {
  clearAuthSession,
  passwordMatches,
  setAuthSession,
} from "@/services/auth/session";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!passwordMatches(password)) {
    redirect("/login?error=1");
  }

  await setAuthSession();
  redirect("/files");
}

export async function logoutAction() {
  await clearAuthSession();
  redirect("/login");
}
