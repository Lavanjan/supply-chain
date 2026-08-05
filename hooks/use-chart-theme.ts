"use client";

import { useThemeStore } from "@/lib/store/theme-store";
import {
  CHART_CATEGORICAL,
  CHART_CHROME,
  CHART_SEQUENTIAL_BLUE,
  CHART_SEQUENTIAL_ORANGE,
  CHART_STATUS,
} from "@/lib/constants/chart-palette";

export function useChartTheme() {
  const mode = useThemeStore((state) => state.mode);

  return {
    mode,
    chrome: CHART_CHROME[mode],
    categorical: CHART_CATEGORICAL[mode],
    sequentialBlue: CHART_SEQUENTIAL_BLUE[mode],
    sequentialOrange: CHART_SEQUENTIAL_ORANGE[mode],
    status: {
      good: CHART_STATUS.good[mode],
      warning: CHART_STATUS.warning[mode],
      serious: CHART_STATUS.serious[mode],
      critical: CHART_STATUS.critical[mode],
    },
  };
}
