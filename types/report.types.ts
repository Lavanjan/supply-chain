export interface ReportResult<TRow, TSummary, TChartPoint> {
  data: TRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: TSummary;
  chart: TChartPoint[];
}

export type StockStatus = "OUT_OF_STOCK" | "LOW_STOCK" | "NORMAL";

export interface InventoryReportRow {
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  unitSymbol: string;
  quantity: number;
  minimumStock: number;
  stockStatus: StockStatus;
}

export interface InventoryReportSummary {
  totalSkus: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface CategoryStockPoint {
  name: string;
  quantity: number;
}

export interface PurchaseReportRow {
  id: string;
  poNumber: string;
  supplierName: string;
  orderDate: string;
  status: string;
  itemCount: number;
}

export interface PurchaseReportSummary {
  totalOrders: number;
  completedCount: number;
}

export interface MonthlyOrderCountPoint {
  month: string;
  count: number;
}

export interface DeliveryReportRow {
  id: string;
  deliveryNumber: string;
  customerName: string;
  warehouseName: string;
  scheduledDate: string;
  deliveredDate: string | null;
  status: string;
  itemCount: number;
}

export interface DeliveryReportSummary {
  totalDeliveries: number;
  deliveredCount: number;
  pendingCount: number;
  cancelledCount: number;
}

export interface DeliveryStatusPoint {
  status: string;
  count: number;
}

export interface StockMovementReportRow {
  id: string;
  date: string;
  productName: string;
  sku: string;
  warehouseName: string;
  type: string;
  referenceType: string | null;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  performedByName: string;
}

export interface StockMovementSummary {
  totalStockIn: number;
  totalStockOut: number;
  netChange: number;
}

export interface StockMovementPoint {
  date: string;
  stockIn: number;
  stockOut: number;
}
