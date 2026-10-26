"use client";

import { SignOutButton } from "@clerk/nextjs";
import { LogOutIcon } from "lucide-react";
import { createContext, useContext } from "react";

// False under the dev bypass, where the layout renders no ClerkProvider.
const ClerkEnabledContext = createContext(false);

export function ClerkEnabled({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <ClerkEnabledContext.Provider value={value}>{children}</ClerkEnabledContext.Provider>;
}

export function AtlasSignOutButton() {
  if (!useContext(ClerkEnabledContext)) return null;
  return (
    <SignOutButton redirectUrl="/sign-in">
      <button className="atlas-signout-button" type="button">
        <LogOutIcon />
        <span>Sign out</span>
      </button>
    </SignOutButton>
  );
}
