import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/constants/routes";

export default async function RootPage() {
  const session = await auth();
  redirect(session?.user ? DEFAULT_LOGIN_REDIRECT : "/login");
}
