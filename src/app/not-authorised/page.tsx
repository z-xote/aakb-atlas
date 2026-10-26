import { redirect } from "next/navigation";

import { AtlasSignOutButton } from "@/features/auth/sign-out-button";
import { AtlasTopbar } from "@/features/files/components/file-ui";
import { getAccess } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function NotAuthorisedPage() {
  const access = await getAccess();
  if (access.status === "signed_out") redirect("/sign-in");
  if (access.status === "allowed") redirect("/files");

  return (
    <main className="atlas-login-shell">
      <AtlasTopbar showSignOut={false} />
      <section className="atlas-login-main">
        <div className="atlas-login-card">
          <div className="atlas-login-brand">
            <span className="atlas-login-mark">A</span>
            <h1>Not authorised</h1>
          </div>
          <p>
            {access.email ? <strong>{access.email}</strong> : "This account"} is not on the
            list of people who can use Atlas. Sign out and try a different Google account,
            or ask Varshil to add this one.
          </p>
          <AtlasSignOutButton />
        </div>
      </section>
    </main>
  );
}
