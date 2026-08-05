import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 dark:from-neutral-950 dark:to-neutral-900 px-4 py-10 sm:px-6">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
