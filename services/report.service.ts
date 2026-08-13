import {
  reportRepository,
  type DateRangeFilters,
  type DeliveryReportFilters,
  type InventoryReportFilters,
  type PurchaseReportFilters,
  type StockMovementReportFilters,
} from "@/repositories/report.repository";
import type {
  CategoryValuePoint,
  DeliveryReportRow,
  DeliveryReportSummary,
  DeliveryStatusPoint,
  InventoryReportRow,
  InventoryReportSummary,
  MonthlyRevenuePoint,
  MonthlySpendPoint,
  ProfitChartPoint,
  ProfitReportRow,
  ProfitReportSummary,
  PurchaseReportRow,
  PurchaseReportSummary,
  ReportResult,
  SalesReportRow,
  SalesReportSummary,
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
): Promise<ReportResult<InventoryReportRow, InventoryReportSummary, CategoryValuePoint>> {
  const products = await reportRepository.getInventoryReportProducts(filters);

  let allRows: InventoryReportRow[] = products.map((product) => {
    const quantity = filters.warehouseId
      ? product.inventories.reduce((sum, row) => sum + Number(row.quantity), 0)
      : Number(product.currentStock);
    const unitCost = Number(product.purchasePrice);
    const minimumStock = Number(product.minimumStock);

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      categoryName: product.category.name,
      unitSymbol: product.unit.symbol,
      quantity,
      unitCost,
      totalValue: round2(quantity * unitCost),
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
    totalStockValue: round2(allRows.reduce((sum, row) => sum + row.totalValue, 0)),
    lowStockCount: allRows.filter((row) => row.stockStatus === "LOW_STOCK").length,
    outOfStockCount: allRows.filter((row) => row.stockStatus === "OUT_OF_STOCK").length,
  };

  const categoryTotals = new Map<string, number>();
  for (const row of allRows) {
    categoryTotals.set(row.categoryName, (categoryTotals.get(row.categoryName) ?? 0) + row.totalValue);
  }
  const chart: CategoryValuePoint[] = Array.from(categoryTotals.entries())
    .map(([name, value]) => ({ name, value: round2(value) }))
    .filter((point) => point.value > 0)
    .sort((a, b) => b.value - a.value)
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
): Promise<ReportResult<PurchaseReportRow, PurchaseReportSummary, MonthlySpendPoint>> {
  const orders = await reportRepository.getPurchaseOrders(filters);

  const allRows: PurchaseReportRow[] = orders
    .map((order) => ({
      id: order.id,
      poNumber: order.poNumber,
      supplierName: order.supplier.companyName,
      orderDate: order.orderDate.toISOString(),
      status: order.status,
      itemCount: order._count.items,
      totalAmount: Number(order.totalAmount),
    }))
    .filter((row) => matchesSearch(filters.search, row.poNumber, row.supplierName));

  const nonCancelled = allRows.filter((row) => row.status !== "CANCELLED");
  const totalSpend = round2(nonCancelled.reduce((sum, row) => sum + row.totalAmount, 0));

  const summary: PurchaseReportSummary = {
    totalOrders: allRows.length,
    totalSpend,
    averageOrderValue: nonCancelled.length > 0 ? round2(totalSpend / nonCancelled.length) : 0,
    completedCount: allRows.filter((row) => row.status === "COMPLETED").length,
  };

  const buckets = new Map<string, { label: string; total: number }>();
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  cursor.setMonth(cursor.getMonth() - (CATEGORY_CHART_MONTHS - 1));
  for (let i = 0; i < CATEGORY_CHART_MONTHS; i++) {
    buckets.set(monthKey(cursor), { label: monthLabel(cursor), total: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  for (const row of allRows) {
    if (row.status === "CANCELLED") continue;
    const bucket = buckets.get(monthKey(new Date(row.orderDate)));
    if (bucket) bucket.total += row.totalAmount;
  }
  const chart: MonthlySpendPoint[] = Array.from(buckets.values()).map((bucket) => ({
    month: bucket.label,
    total: round2(bucket.total),
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

async function getSalesReport(
  filters: DeliveryReportFilters & { search?: string },
  page: PageParams,
): Promise<ReportResult<SalesReportRow, SalesReportSummary, MonthlyRevenuePoint>> {
  const deliveries = await reportRepository.getDeliveries(filters);

  const allRows: SalesReportRow[] = deliveries
    .map((delivery) => ({
      id: delivery.id,
      deliveryNumber: delivery.deliveryNumber,
      customerName: delivery.customer.companyName,
      scheduledDate: delivery.scheduledDate.toISOString(),
      status: delivery.status,
      itemCount: delivery._count.items,
      totalAmount: Number(delivery.totalAmount),
    }))
    .filter((row) => matchesSearch(filters.search, row.deliveryNumber, row.customerName));

  const nonCancelled = allRows.filter((row) => row.status !== "CANCELLED");
  const totalRevenue = round2(nonCancelled.reduce((sum, row) => sum + row.totalAmount, 0));

  const summary: SalesReportSummary = {
    totalDeliveries: allRows.length,
    totalRevenue,
    averageDeliveryValue: nonCancelled.length > 0 ? round2(totalRevenue / nonCancelled.length) : 0,
    deliveredCount: allRows.filter((row) => row.status === "DELIVERED").length,
  };

  const buckets = new Map<string, { label: string; total: number }>();
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  cursor.setMonth(cursor.getMonth() - (CATEGORY_CHART_MONTHS - 1));
  for (let i = 0; i < CATEGORY_CHART_MONTHS; i++) {
    buckets.set(monthKey(cursor), { label: monthLabel(cursor), total: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  for (const row of allRows) {
    if (row.status === "CANCELLED") continue;
    const bucket = buckets.get(monthKey(new Date(row.scheduledDate)));
    if (bucket) bucket.total += row.totalAmount;
  }
  const chart: MonthlyRevenuePoint[] = Array.from(buckets.values()).map((bucket) => ({
    month: bucket.label,
    total: round2(bucket.total),
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

async function getProfitReport(filters: DateRangeFilters): Promise<{
  summary: ProfitReportSummary;
  chart: ProfitChartPoint[];
  rows: ProfitReportRow[];
}> {
  const items = await reportRepository.getDeliveryItemsForProfit(filters);

  const buckets = new Map<string, { label: string; revenue: number; cost: number }>();
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  cursor.setMonth(cursor.getMonth() - (CATEGORY_CHART_MONTHS - 1));
  for (let i = 0; i < CATEGORY_CHART_MONTHS; i++) {
    buckets.set(monthKey(cursor), { label: monthLabel(cursor), revenue: 0, cost: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const item of items) {
    const bucket = buckets.get(monthKey(item.delivery.scheduledDate));
    if (!bucket) continue;
    const quantity = Number(item.quantity);
    bucket.revenue += quantity * Number(item.unitPrice);
    bucket.cost += quantity * Number(item.product.purchasePrice);
  }

  function marginOf(revenue: number, cost: number): number {
    return revenue > 0 ? round2(((revenue - cost) / revenue) * 100) : 0;
  }

  const rows: ProfitReportRow[] = Array.from(buckets.values()).map((bucket) => ({
    month: bucket.label,
    revenue: round2(bucket.revenue),
    costOfGoods: round2(bucket.cost),
    profit: round2(bucket.revenue - bucket.cost),
    marginPercent: marginOf(bucket.revenue, bucket.cost),
  }));

  const chart: ProfitChartPoint[] = rows.map((row) => ({ month: row.month, revenue: row.revenue, cost: row.costOfGoods }));

  const totalRevenue = round2(rows.reduce((sum, row) => sum + row.revenue, 0));
  const totalCostOfGoods = round2(rows.reduce((sum, row) => sum + row.costOfGoods, 0));
  const summary: ProfitReportSummary = {
    totalRevenue,
    totalCostOfGoods,
    grossProfit: round2(totalRevenue - totalCostOfGoods),
    marginPercent: marginOf(totalRevenue, totalCostOfGoods),
  };

  return { summary, chart, rows };
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
  getSalesReport,
  getProfitReport,
  getStockMovementReport,
};
