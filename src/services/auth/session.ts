import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isProduction } from "@/services/env";
import { getAuthEnv } from "@/services/auth/env";

function makeSessionValue() {
  const { authSecret, sharedPassword } = getAuthEnv();

  return createHmac("sha256", authSecret)
    .update(`atlas:${sharedPassword}`)
    .digest("hex");
}

function safeEquals(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export async function isAuthenticated() {
  const { cookieName } = getAuthEnv();
  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName)?.value;

  return Boolean(value && safeEquals(value, makeSessionValue()));
}

export async function requireAuth() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
}

export async function setAuthSession() {
  const { cookieName } = getAuthEnv();
  const cookieStore = await cookies();

  cookieStore.set(cookieName, makeSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
  });
}

export async function clearAuthSession() {
  const { cookieName } = getAuthEnv();
  const cookieStore = await cookies();

  cookieStore.delete(cookieName);
}

export function passwordMatches(value: string) {
  return safeEquals(value, getAuthEnv().sharedPassword);
}
