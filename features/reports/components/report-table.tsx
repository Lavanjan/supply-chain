"use client";

import type { ReactNode } from "react";
import { Empty, Pagination, Skeleton, Table, type TableColumnsType } from "antd";
import { useIsMobile } from "@/hooks/use-is-mobile";

interface ReportTableProps<T> {
  columns: TableColumnsType<T>;
  dataSource: T[];
  rowKey: string | ((record: T) => string);
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  renderMobileCard: (record: T) => ReactNode;
  emptyText?: string;
}

export function ReportTable<T extends object>({
  columns,
  dataSource,
  rowKey,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  renderMobileCard,
  emptyText = "No records found",
}: ReportTableProps<T>) {
  const isMobile = useIsMobile();
  const keyOf = typeof rowKey === "function" ? rowKey : (record: T) => String((record as never)[rowKey]);

  return (
    <div className="flex flex-col gap-3">
      {isMobile ? (
        <div className="flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-black/5 dark:border-white/10 p-4">
                <Skeleton active title paragraph={{ rows: 2 }} />
              </div>
            ))
          ) : dataSource.length === 0 ? (
            <Empty description={emptyText} />
          ) : (
            dataSource.map((record) => <div key={keyOf(record)}>{renderMobileCard(record)}</div>)
          )}
        </div>
      ) : (
        <Table<T>
          columns={columns}
          dataSource={dataSource}
          rowKey={keyOf}
          loading={loading}
          pagination={false}
          locale={{ emptyText }}
          scroll={{ x: "max-content" }}
        />
      )}

      {total > 0 && (
        <div className="flex justify-end">
          <Pagination current={page} pageSize={pageSize} total={total} onChange={onPageChange} showSizeChanger={false} responsive />
        </div>
      )}
    </div>
  );
}
