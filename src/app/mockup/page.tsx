import type { Metadata } from "next";

import { MockupShell } from "./shell";

export const metadata: Metadata = {
  title: "Atlas v0.2 UI Mockup",
  description: "Slide-through mockup of the Atlas v0.2 screens.",
};

export default function MockupPage() {
  return <MockupShell />;
}
