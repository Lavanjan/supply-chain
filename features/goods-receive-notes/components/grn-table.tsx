"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Tag, Typography, type TableColumnsType } from "antd";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermission } from "@/hooks/use-permission";
import { GoodsReceiveNoteFormModal } from "@/features/goods-receive-notes/components/grn-form-modal";
import { GoodsReceiveNoteDetailModal } from "@/features/goods-receive-notes/components/grn-detail-modal";
import type { GoodsReceiveNoteListItem } from "@/types/goods-receive-note.types";

export function GoodsReceiveNoteTable() {
  const { can } = usePermission();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const table = useDataTable<GoodsReceiveNoteListItem>({ endpoint: "/api/goods-receive-notes" });

  useEffect(() => {
    const view = searchParams.get("view");
    if (view) {
      setViewingId(view);
      router.replace("/dashboard/goods-receive-notes");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: TableColumnsType<GoodsReceiveNoteListItem> = [
    { title: "GRN Number", dataIndex: "grnNumber" },
    { title: "PO Number", dataIndex: "poNumber" },
    { title: "Supplier", dataIndex: "supplierName" },
    { title: "Warehouse", dataIndex: "warehouseName" },
    {
      title: "Received Date",
      dataIndex: "receivedDate",
      render: (value: string) => dayjs(value).format("MMM D, YYYY"),
    },
    { title: "Items", dataIndex: "itemCount", align: "right" },
    { title: "Received By", dataIndex: "receivedByName" },
    {
      title: "Status",
      dataIndex: "status",
      render: (value: string) => <Tag color="green">{value}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Button type="text" icon={<EyeOutlined />} onClick={() => setViewingId(record.id)} />
      ),
    },
  ];

  return (
    <>
      <DataTable<GoodsReceiveNoteListItem>
        columns={columns}
        dataSource={table.data}
        rowKey="id"
        loading={table.loading}
        total={table.total}
        page={table.page}
        pageSize={table.pageSize}
        onPageChange={table.setPage}
        searchValue={table.searchInput}
        onSearchChange={table.setSearchInput}
        searchPlaceholder="Search GRN or PO number..."
        emptyText="No goods receive notes yet"
        toolbarExtra={
          can("goods-receive-notes.create") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              Receive Goods
            </Button>
          )
        }
        renderMobileCard={(grn) => (
          <Card size="small" className="rounded-xl cursor-pointer" onClick={() => setViewingId(grn.id)}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <Typography.Text strong className="block">
                  {grn.grnNumber}
                </Typography.Text>
                <span className="text-xs text-neutral-500">
                  {grn.poNumber} · {grn.supplierName}
                </span>
              </div>
              <Tag color="green">{grn.status}</Tag>
            </div>
            <div className="text-xs text-neutral-400 mt-2">
              {dayjs(grn.receivedDate).format("MMM D, YYYY")} · {grn.receivedByName}
            </div>
          </Card>
        )}
      />

      <GoodsReceiveNoteFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={table.reload}
        onCreated={(id) => {
          setModalOpen(false);
          setViewingId(id);
        }}
      />

      <GoodsReceiveNoteDetailModal open={viewingId !== null} id={viewingId} onClose={() => setViewingId(null)} />
    </>
  );
}
