import type { Locale } from "@/lib/i18n/config";

/**
 * Each namespace maps 1:1 to a JSON file under messages/<locale>/<namespace>.json.
 * Adding a new module's translations means: add its name here, then create the
 * matching messages/en/<name>.json and messages/si/<name>.json files.
 */
export const NAMESPACES = ["common", "nav", "auth", "dashboard", "products"] as const;

export type Namespace = (typeof NAMESPACES)[number];

export async function getMessages(locale: Locale) {
  const modules = await Promise.all(
    NAMESPACES.map((namespace) => import(`@/messages/${locale}/${namespace}.json`)),
  );

  return Object.fromEntries(NAMESPACES.map((namespace, index) => [namespace, modules[index].default]));
}
