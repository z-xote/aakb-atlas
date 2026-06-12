import { redirect } from "next/navigation";
import { LockIcon } from "lucide-react";

import { AtlasTopbar } from "@/features/files/components/file-ui";
import { loginAction } from "@/services/auth/actions";
import { isAuthenticated } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthenticated()) {
    redirect("/files");
  }

  const params = await searchParams;

  return (
    <main className="atlas-login-shell">
      <AtlasTopbar showSignOut={false} />

      <section className="atlas-login-main">
        <div className="atlas-login-card">
          <div className="atlas-login-brand">
            <div className="atlas-login-mark">
              <LockIcon />
            </div>
            <div>
              <div className="atlas-eyebrow">Atlas</div>
              <h1>Shared password</h1>
              <p className="atlas-muted">All About Kitchens & Bathrooms</p>
            </div>
          </div>

          <form action={loginAction}>
            <div className="atlas-login-field">
              <label htmlFor="password">Password</label>
              <input
                aria-invalid={params.error ? true : undefined}
                autoComplete="current-password"
                id="password"
                name="password"
                required
                type="password"
              />
              {params.error ? (
                <p className="atlas-login-error">Wrong password.</p>
              ) : null}
            </div>

            <button className="atlas-login-submit" type="submit">
              Open files
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
