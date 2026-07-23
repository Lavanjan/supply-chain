"use client";

import { Empty } from "antd";

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center">
      <Empty description={message} image={Empty.PRESENTED_IMAGE_SIMPLE} />
    </div>
  );
}
