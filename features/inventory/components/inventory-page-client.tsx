"use client";

import { useState } from "react";
import { Button, Tabs } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, HistoryOutlined, SwapOutlined, ToolOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/use-permission";
import { InventoryStockTable } from "@/features/inventory/components/inventory-stock-table";
import { InventoryHistoryTable } from "@/features/inventory/components/inventory-history-table";
import { StockInModal } from "@/features/inventory/components/stock-in-modal";
import { StockOutModal } from "@/features/inventory/components/stock-out-modal";
import { AdjustmentModal } from "@/features/inventory/components/adjustment-modal";
import { TransferModal } from "@/features/inventory/components/transfer-modal";

type ActiveModal = "stockIn" | "stockOut" | "adjust" | "transfer" | null;

export function InventoryPageClient() {
  const { can } = usePermission();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [stockWarehouseId, setStockWarehouseId] = useState<string | undefined>();
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [historyWarehouseId, setHistoryWarehouseId] = useState<string | undefined>();
  const [historyType, setHistoryType] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();

  function handleSuccess() {
    setRefreshToken((token) => token + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 justify-end">
        {can("inventory.stockIn") && (
          <Button icon={<ArrowUpOutlined />} onClick={() => setActiveModal("stockIn")}>
            Stock In
          </Button>
        )}
        {can("inventory.stockOut") && (
          <Button icon={<ArrowDownOutlined />} onClick={() => setActiveModal("stockOut")}>
            Stock Out
          </Button>
        )}
        {can("inventory.adjust") && (
          <Button icon={<ToolOutlined />} onClick={() => setActiveModal("adjust")}>
            Adjustment
          </Button>
        )}
        {can("inventory.transfer") && (
          <Button icon={<SwapOutlined />} onClick={() => setActiveModal("transfer")}>
            Transfer
          </Button>
        )}
      </div>

      <Tabs
        defaultActiveKey="stock"
        items={[
          {
            key: "stock",
            label: "Current Stock",
            children: (
              <InventoryStockTable
                key={`stock-${refreshToken}`}
                warehouseId={stockWarehouseId}
                onWarehouseChange={setStockWarehouseId}
                lowStockOnly={lowStockOnly}
                onLowStockOnlyChange={setLowStockOnly}
              />
            ),
          },
          {
            key: "history",
            label: (
              <span>
                <HistoryOutlined /> Inventory History
              </span>
            ),
            children: (
              <InventoryHistoryTable
                key={`history-${refreshToken}`}
                warehouseId={historyWarehouseId}
                onWarehouseChange={setHistoryWarehouseId}
                type={historyType}
                onTypeChange={setHistoryType}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateRangeChange={(from, to) => {
                  setDateFrom(from);
                  setDateTo(to);
                }}
              />
            ),
          },
        ]}
      />

      <StockInModal open={activeModal === "stockIn"} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      <StockOutModal open={activeModal === "stockOut"} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      <AdjustmentModal open={activeModal === "adjust"} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      <TransferModal open={activeModal === "transfer"} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
    </div>
  );
}
