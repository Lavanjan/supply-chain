"use client";

import { Grid } from "antd";

/**
 * `useBreakpoint()` returns `{}` until the client measures the viewport, so checking
 * `!screens.md` would default every SSR pass and first paint to "mobile". Checking for
 * an explicit `false` avoids that flash by defaulting to desktop until confirmed otherwise.
 */
export function useIsMobile() {
  const screens = Grid.useBreakpoint();
  return screens.md === false;
}
