"use client";

import type { ReactNode } from "react";
import { Empty, Input, Pagination, Skeleton, Table, type TableColumnsType } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useIsMobile } from "@/hooks/use-is-mobile";

interface DataTableProps<T> {
  columns: TableColumnsType<T>;
  dataSource: T[];
  rowKey: string | ((record: T) => string);
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onSortChange?: (field?: string, order?: "ascend" | "descend") => void;
  filters?: ReactNode;
  toolbarExtra?: ReactNode;
  renderMobileCard: (record: T) => ReactNode;
  emptyText?: string;
}

export function DataTable<T extends object>({
  columns,
  dataSource,
  rowKey,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  onSortChange,
  filters,
  toolbarExtra,
  renderMobileCard,
  emptyText = "No records found",
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const keyOf = typeof rowKey === "function" ? rowKey : (record: T) => String((record as never)[rowKey]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <Input
          allowClear
          placeholder={searchPlaceholder}
          prefix={<SearchOutlined className="text-neutral-400" />}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="sm:max-w-xs"
        />
        {filters}
        <div className="sm:ml-auto flex gap-2">{toolbarExtra}</div>
      </div>

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
          onChange={(_pagination, _filters, sorter) => {
            if (!onSortChange) return;
            const single = Array.isArray(sorter) ? sorter[0] : sorter;
            onSortChange(
              single?.order ? String(single.field) : undefined,
              single?.order as "ascend" | "descend" | undefined,
            );
          }}
        />
      )}

      {total > 0 && (
        <div className="flex justify-end">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={onPageChange}
            showSizeChanger={false}
            responsive
          />
        </div>
      )}
    </div>
  );
}
