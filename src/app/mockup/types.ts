import type { ComponentType } from "react";

export type MockupViewport = "desktop" | "phone" | "phone-landscape";

export type MockupScreenState = {
  id: string;
  label: string;
};

export type MockupScreenProps = {
  /** Active mock-state id. Always one of the screen's declared states (or "default"). */
  stateId: string;
};

export type MockupScreen = {
  /** Stable slug, matches the file name. */
  id: string;
  title: string;
  /** One-liner shown in the mockup controls. */
  description: string;
  /** Frame the screen is designed for. Defaults to "desktop". */
  viewport?: MockupViewport;
  /**
   * Server-driven variants toggled from the mockup controls (first entry is
   * the default). Purely interactive variation (tabs, pickers) should be real
   * UI inside the screen instead.
   */
  states?: MockupScreenState[];
  Component: ComponentType<MockupScreenProps>;
};
