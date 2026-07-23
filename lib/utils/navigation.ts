import { NAV_GROUPS } from "@/lib/constants/navigation";

export function getPageTitle(pathname: string): string {
  const allItems = NAV_GROUPS.flatMap((group) => group.items);
  const matches = allItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length);

  return matches[0]?.label ?? "Dashboard";
}
