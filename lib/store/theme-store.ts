import { create } from "zustand";
import type { ThemeMode } from "@/lib/constants/theme";

function getInitialMode(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: getInitialMode(),
  setMode: (mode) => set({ mode }),
  toggle: () => set((state) => ({ mode: state.mode === "light" ? "dark" : "light" })),
}));
