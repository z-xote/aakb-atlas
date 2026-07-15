import type { ComponentType } from "react";

export type MockupViewport = "desktop" | "phone" | "phone-landscape";

export type MockupScreenState = {
  id: string;
  label: string;
};

export type MockupScreenProps = {
  /** Active mock-state id. Always one of the screen's declared states (or "default"). */
  stateId: string;
  /**
   * Effective device frame the shell is currently rendering the screen inside.
   * Both phone frames live inside the same desktop browser viewport, so screens
   * that must differ by orientation should branch on this rather than on
   * browser-width media queries. Screens that don't care can ignore it.
   */
  viewport: MockupViewport;
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
