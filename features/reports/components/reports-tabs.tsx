"use client";

import { Tabs } from "antd";
import { InventoryReport } from "@/features/reports/components/inventory-report";
import { PurchaseReport } from "@/features/reports/components/purchase-report";
import { DeliveryReport } from "@/features/reports/components/delivery-report";
import { SalesReport } from "@/features/reports/components/sales-report";
import { ProfitReport } from "@/features/reports/components/profit-report";
import { StockMovementReport } from "@/features/reports/components/stock-movement-report";

export function ReportsTabs() {
  return (
    <Tabs
      defaultActiveKey="inventory"
      items={[
        { key: "inventory", label: "Inventory Valuation", children: <InventoryReport /> },
        { key: "purchases", label: "Purchases", children: <PurchaseReport /> },
        { key: "deliveries", label: "Deliveries", children: <DeliveryReport /> },
        { key: "sales", label: "Sales", children: <SalesReport /> },
        { key: "profit", label: "Profit", children: <ProfitReport /> },
        { key: "stock-movement", label: "Stock Movement", children: <StockMovementReport /> },
      ]}
    />
  );
}
