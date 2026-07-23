import type { Metadata } from "next";
import dayjs from "dayjs";
import { requireSession } from "@/lib/rbac/permissions";
import { QuickAccess } from "@/features/dashboard/components/quick-access";
import { WelcomeCard } from "@/features/dashboard/components/welcome-card";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireSession();
  const { user } = session;
  const firstName = (user.name ?? user.email ?? "").split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-4">
      <WelcomeCard
        firstName={firstName}
        role={user.role}
        formattedDate={dayjs().format("dddd, MMMM D, YYYY")}
      />
      <QuickAccess permissions={user.permissions} />
    </div>
  );
}
