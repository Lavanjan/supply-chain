import type { Metadata } from "next";
import { ForbiddenResult } from "@/components/common/forbidden-result";

export const metadata: Metadata = { title: "Access Denied" };

export default function ForbiddenPage() {
  return <ForbiddenResult />;
}
