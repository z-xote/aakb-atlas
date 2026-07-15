import { redirect } from "next/navigation";

import { DeviceLogin } from "@/features/auth/device-login";
import { AtlasTopbar } from "@/features/files/components/file-ui";
import { isAuthenticated } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/files");

  return (
    <main className="atlas-login-shell">
      <AtlasTopbar showSignOut={false} />
      <section className="atlas-login-main">
        <DeviceLogin />
      </section>
    </main>
  );
}
