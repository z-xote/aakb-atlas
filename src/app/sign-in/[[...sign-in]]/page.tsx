import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AtlasTopbar } from "@/features/files/components/file-ui";
import { isDevAuthBypassActive } from "@/services/auth/dev-bypass";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  if (isDevAuthBypassActive()) redirect("/files");

  return (
    <main className="atlas-login-shell">
      <AtlasTopbar showSignOut={false} />
      <section className="atlas-login-main">
        <Suspense>
          <SignIn fallbackRedirectUrl="/files" />
        </Suspense>
      </section>
    </main>
  );
}
