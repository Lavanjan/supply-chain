import {
  reportRepository,
  type DeliveryReportFilters,
  type InventoryReportFilters,
  type PurchaseReportFilters,
  type StockMovementReportFilters,
} from "@/repositories/report.repository";
import type {
  CategoryStockPoint,
  DeliveryReportRow,
  DeliveryReportSummary,
  DeliveryStatusPoint,
  InventoryReportRow,
  InventoryReportSummary,
  MonthlyOrderCountPoint,
  PurchaseReportRow,
  PurchaseReportSummary,
  ReportResult,
  StockMovementPoint,
  StockMovementReportRow,
  StockMovementSummary,
  StockStatus,
} from "@/types/report.types";

const CATEGORY_CHART_MONTHS = 6;
const CATEGORY_CHART_LIMIT = 8;

interface PageParams {
  page: number;
  pageSize: number;
}

function paginate<T>(rows: T[], { page, pageSize }: PageParams): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function stockStatusOf(quantity: number, minimumStock: number): StockStatus {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= minimumStock) return "LOW_STOCK";
  return "NORMAL";
}

function matchesSearch(search: string | undefined, ...fields: string[]): boolean {
  if (!search) return true;
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field.toLowerCase().includes(needle));
}

async function getInventoryReport(
  filters: InventoryReportFilters & { lowStockOnly?: boolean; search?: string },
  page: PageParams,
): Promise<ReportResult<InventoryReportRow, InventoryReportSummary, CategoryStockPoint>> {
  const products = await reportRepository.getInventoryReportProducts(filters);

  let allRows: InventoryReportRow[] = products.map((product) => {
    const quantity = filters.warehouseId
      ? product.inventories.reduce((sum, row) => sum + Number(row.quantity), 0)
      : Number(product.currentStock);
    const minimumStock = Number(product.minimumStock);

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      categoryName: product.category.name,
      unitSymbol: product.unit.symbol,
      quantity,
      minimumStock,
      stockStatus: stockStatusOf(quantity, minimumStock),
    };
  });

  if (filters.lowStockOnly) {
    allRows = allRows.filter((row) => row.stockStatus !== "NORMAL");
  }
  allRows = allRows.filter((row) => matchesSearch(filters.search, row.productName, row.sku));

  const summary: InventoryReportSummary = {
    totalSkus: allRows.length,
    lowStockCount: allRows.filter((row) => row.stockStatus === "LOW_STOCK").length,
    outOfStockCount: allRows.filter((row) => row.stockStatus === "OUT_OF_STOCK").length,
  };

  const categoryTotals = new Map<string, number>();
  for (const row of allRows) {
    categoryTotals.set(row.categoryName, (categoryTotals.get(row.categoryName) ?? 0) + row.quantity);
  }
  const chart: CategoryStockPoint[] = Array.from(categoryTotals.entries())
    .map(([name, quantity]) => ({ name, quantity: round2(quantity) }))
    .filter((point) => point.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, CATEGORY_CHART_LIMIT);

  return {
    data: paginate(allRows, page),
    total: allRows.length,
    page: page.page,
    pageSize: page.pageSize,
    summary,
    chart,
  };
}

async function getPurchaseReport(
  filters: PurchaseReportFilters & { search?: string },
  page: PageParams,
): Promise<ReportResult<PurchaseReportRow, PurchaseReportSummary, MonthlyOrderCountPoint>> {
  const orders = await reportRepository.getPurchaseOrders(filters);

  const allRows: PurchaseReportRow[] = orders
    .map((order) => ({
      id: order.id,
      poNumber: order.poNumber,
      supplierName: order.supplier.companyName,
      orderDate: order.orderDate.toISOString(),
      status: order.status,
      itemCount: order._count.items,
    }))
    .filter((row) => matchesSearch(filters.search, row.poNumber, row.supplierName));

  const summary: PurchaseReportSummary = {
    totalOrders: allRows.length,
    completedCount: allRows.filter((row) => row.status === "COMPLETED").length,
  };

  const buckets = new Map<string, { label: string; count: number }>();
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  cursor.setMonth(cursor.getMonth() - (CATEGORY_CHART_MONTHS - 1));
  for (let i = 0; i < CATEGORY_CHART_MONTHS; i++) {
    buckets.set(monthKey(cursor), { label: monthLabel(cursor), count: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  for (const row of allRows) {
    if (row.status === "CANCELLED") continue;
    const bucket = buckets.get(monthKey(new Date(row.orderDate)));
    if (bucket) bucket.count += 1;
  }
  const chart: MonthlyOrderCountPoint[] = Array.from(buckets.values()).map((bucket) => ({
    month: bucket.label,
    count: bucket.count,
  }));

  return {
    data: paginate(allRows, page),
    total: allRows.length,
    page: page.page,
    pageSize: page.pageSize,
    summary,
    chart,
  };
}

async function getDeliveryReport(
  filters: DeliveryReportFilters & { search?: string },
  page: PageParams,
): Promise<ReportResult<DeliveryReportRow, DeliveryReportSummary, DeliveryStatusPoint>> {
  const deliveries = await reportRepository.getDeliveries(filters);

  const allRows: DeliveryReportRow[] = deliveries
    .map((delivery) => ({
      id: delivery.id,
      deliveryNumber: delivery.deliveryNumber,
      customerName: delivery.customer.companyName,
      warehouseName: delivery.warehouse.name,
      scheduledDate: delivery.scheduledDate.toISOString(),
      deliveredDate: delivery.deliveredDate ? delivery.deliveredDate.toISOString() : null,
      status: delivery.status,
      itemCount: delivery._count.items,
    }))
    .filter((row) => matchesSearch(filters.search, row.deliveryNumber, row.customerName));

  const summary: DeliveryReportSummary = {
    totalDeliveries: allRows.length,
    deliveredCount: allRows.filter((row) => row.status === "DELIVERED").length,
    pendingCount: allRows.filter((row) => row.status === "PENDING").length,
    cancelledCount: allRows.filter((row) => row.status === "CANCELLED").length,
  };

  const chart: DeliveryStatusPoint[] = [
    { status: "Pending", count: summary.pendingCount },
    { status: "Delivered", count: summary.deliveredCount },
    { status: "Cancelled", count: summary.cancelledCount },
  ];

  return {
    data: paginate(allRows, page),
    total: allRows.length,
    page: page.page,
    pageSize: page.pageSize,
    summary,
    chart,
  };
}

async function getStockMovementReport(
  filters: StockMovementReportFilters & { search?: string },
  page: PageParams,
): Promise<ReportResult<StockMovementReportRow, StockMovementSummary, StockMovementPoint>> {
  const movements = await reportRepository.getStockMovements(filters);

  const allRows: StockMovementReportRow[] = movements
    .map((movement) => ({
      id: movement.id,
      date: movement.createdAt.toISOString(),
      productName: movement.product.name,
      sku: movement.product.sku,
      warehouseName: movement.warehouse.name,
      type: movement.type,
      referenceType: movement.referenceType,
      quantity: Number(movement.quantity),
      previousQuantity: Number(movement.previousQuantity),
      newQuantity: Number(movement.newQuantity),
      performedByName: movement.performedBy.name,
    }))
    .filter((row) => matchesSearch(filters.search, row.productName, row.sku));

  const inTypes = new Set(["STOCK_IN", "TRANSFER_IN"]);
  const outTypes = new Set(["STOCK_OUT", "TRANSFER_OUT"]);

  const totalStockIn = round2(allRows.filter((row) => inTypes.has(row.type)).reduce((sum, row) => sum + row.quantity, 0));
  const totalStockOut = round2(allRows.filter((row) => outTypes.has(row.type)).reduce((sum, row) => sum + row.quantity, 0));
  const netChange = round2(allRows.reduce((sum, row) => sum + (row.newQuantity - row.previousQuantity), 0));

  const summary: StockMovementSummary = { totalStockIn, totalStockOut, netChange };

  const buckets = new Map<string, { date: string; stockIn: number; stockOut: number }>();
  for (const row of allRows) {
    const dayLabel = new Date(row.date).toLocaleString("en-US", { month: "short", day: "numeric" });
    const key = row.date.slice(0, 10);
    if (!buckets.has(key)) buckets.set(key, { date: dayLabel, stockIn: 0, stockOut: 0 });
    const bucket = buckets.get(key)!;
    if (inTypes.has(row.type)) bucket.stockIn += row.quantity;
    if (outTypes.has(row.type)) bucket.stockOut += row.quantity;
  }
  const chart: StockMovementPoint[] = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, bucket]) => ({ date: bucket.date, stockIn: round2(bucket.stockIn), stockOut: round2(bucket.stockOut) }));

  return {
    data: paginate(allRows, page),
    total: allRows.length,
    page: page.page,
    pageSize: page.pageSize,
    summary,
    chart,
  };
}

export const reportService = {
  getInventoryReport,
  getPurchaseReport,
  getDeliveryReport,
  getStockMovementReport,
};
