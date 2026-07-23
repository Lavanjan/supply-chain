"use client";

import { useThemeStore } from "@/lib/store/theme-store";
import {
  CHART_CATEGORICAL,
  CHART_CHROME,
  CHART_SEQUENTIAL_BLUE,
  CHART_SEQUENTIAL_ORANGE,
} from "@/lib/constants/chart-palette";

export function useChartTheme() {
  const mode = useThemeStore((state) => state.mode);

  return {
    mode,
    chrome: CHART_CHROME[mode],
    categorical: CHART_CATEGORICAL[mode],
    sequentialBlue: CHART_SEQUENTIAL_BLUE[mode],
    sequentialOrange: CHART_SEQUENTIAL_ORANGE[mode],
  };
}
