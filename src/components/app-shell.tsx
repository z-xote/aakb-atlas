import Link from "next/link";
import { ArrowLeftIcon, FolderKanbanIcon, LogOutIcon, PlusIcon } from "lucide-react";

import { ThemeMenu } from "@/features/files/components/theme-menu";
import { logoutAction } from "@/services/auth/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  eyebrow?: string;
  backHref?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function AppShell({
  children,
  title,
  eyebrow = "Atlas",
  backHref,
  actionHref,
  actionLabel,
}: AppShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-6">
          {backHref ? (
            <Link
              href={backHref}
              className={buttonVariants({ variant: "ghost", size: "icon" })}
              aria-label="Back"
            >
              <ArrowLeftIcon />
            </Link>
          ) : (
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <FolderKanbanIcon />
            </div>
          )}

          <Link href="/files" className="min-w-0 leading-tight">
            <span className="block text-[11px] font-medium uppercase tracking-normal text-muted-foreground">
              {eyebrow}
            </span>
            <strong className="block truncate text-sm">{title}</strong>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {actionHref && actionLabel ? (
              <Link
                href={actionHref}
                className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
              >
                <PlusIcon data-icon="inline-start" />
                {actionLabel}
              </Link>
            ) : null}
            <ThemeMenu />
            <form action={logoutAction}>
              <button className="atlas-signout-button" type="submit">
                <LogOutIcon />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 md:px-6">
        {children}
      </div>
    </main>
  );
}
