"use client";

import Link from "next/link";
import { Button, Result } from "antd";

export function ForbiddenResult() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you don't have permission to access this page."
        extra={
          <Link href="/dashboard">
            <Button type="primary">Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
