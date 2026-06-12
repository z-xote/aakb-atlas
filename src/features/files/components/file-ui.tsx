import Link from "next/link";
import { ArrowLeftIcon, LogOutIcon } from "lucide-react";

import { ThemeMenu } from "@/features/files/components/theme-menu";
import { logoutAction } from "@/services/auth/actions";
import { cn } from "@/lib/utils";

export {
  AddIconBox,
  AtlasInfoField,
  AtlasPill,
  formatAtlasDate,
  relationshipBadgeTone,
  relationshipShortLabel,
  splitFileTitle,
  workflowReadyLabel,
} from "@/features/files/components/atlas-primitives";

export function AtlasTopbar({
  backHref,
  current,
  fileName,
  showSignOut = true,
}: {
  backHref?: string;
  current?: string;
  fileName?: string;
  showSignOut?: boolean;
}) {
  return (
    <header className="atlas-topbar">
      {backHref ? (
        <>
          <Link className="atlas-icon-button" href={backHref} aria-label="Back">
            <ArrowLeftIcon />
          </Link>
          <nav className="atlas-breadcrumb" aria-label="Breadcrumb">
            <Link href="/files">Files</Link>
            {fileName ? (
              <>
                <span>/</span>
                {current === "Pipelines" ? (
                  <Link href={backHref}>{fileName}</Link>
                ) : (
                  <span className="atlas-current">{fileName}</span>
                )}
              </>
            ) : null}
            {current === "Pipelines" ? (
              <>
                <span>/</span>
                <span className="atlas-current">Pipelines</span>
              </>
            ) : null}
          </nav>
        </>
      ) : (
        <Link className="atlas-brand" href="/files" aria-label="Atlas files">
          <span className="atlas-brand-mark">A</span>
          <span className="atlas-brand-copy">
            <strong>Atlas</strong>
            <span>All About Kitchens & Bathrooms</span>
          </span>
        </Link>
      )}

      <div className="atlas-topbar-spacer" />
      <div className="atlas-topbar-actions">
        <ThemeMenu />
        {showSignOut ? (
          <form action={logoutAction}>
            <button className="atlas-signout-button" type="submit">
              <LogOutIcon />
              <span>Sign out</span>
            </button>
          </form>
        ) : null}
      </div>
    </header>
  );
}

export function FileBottomNav({
  fileId,
  active,
}: {
  fileId: string;
  active: "details" | "pipelines";
}) {
  return (
    <footer className="atlas-bottom-nav">
      <nav className="atlas-bottom-nav-inner" aria-label="File sections">
        <Link
          className={cn(
            "atlas-bottom-nav-item",
            active === "details" && "atlas-active"
          )}
          href={`/files/${fileId}`}
        >
          File Details
        </Link>
        <Link
          className={cn(
            "atlas-bottom-nav-item",
            active === "pipelines" && "atlas-active"
          )}
          href={`/files/${fileId}/pipelines`}
        >
          Pipelines
        </Link>
      </nav>
    </footer>
  );
}
