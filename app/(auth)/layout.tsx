import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 dark:from-neutral-950 dark:to-neutral-900 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
