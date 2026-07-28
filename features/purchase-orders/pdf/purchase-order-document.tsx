import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import dayjs from "dayjs";
import { formatCurrency } from "@/lib/utils/format";
import type { PurchaseOrderDetail } from "@/types/purchase-order.types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#171717" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#666666", marginTop: 2 },
  poNumber: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "right" },
  status: { fontSize: 10, textAlign: "right", marginTop: 2, color: "#666666" },
  section: { marginBottom: 16 },
  sectionRow: { flexDirection: "row", gap: 24 },
  sectionBlock: { flex: 1 },
  label: { fontSize: 8, color: "#888888", textTransform: "uppercase", marginBottom: 2 },
  value: { fontSize: 10, marginBottom: 6 },
  table: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#e0e0e0" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e0e0e0", paddingVertical: 6 },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#171717", paddingVertical: 6 },
  colProduct: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colDiscount: { flex: 1, textAlign: "right" },
  colTax: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  headerText: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  totalsBlock: { marginTop: 16, alignItems: "flex-end" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", width: 200, marginBottom: 3 },
  totalsLabel: { color: "#666666" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#171717",
  },
  grandTotalText: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  notes: { marginTop: 20, fontSize: 9, color: "#666666" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 8, color: "#999999", textAlign: "center" },
});

export function PurchaseOrderDocument({ po }: { po: PurchaseOrderDetail }) {
  return (
    <Document title={`Purchase Order ${po.poNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Supply Chain & Inventory</Text>
            <Text style={styles.subtitle}>Purchase Order</Text>
          </View>
          <View>
            <Text style={styles.poNumber}>{po.poNumber}</Text>
            <Text style={styles.status}>{po.status}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.sectionBlock}>
            <Text style={styles.label}>Supplier</Text>
            <Text style={styles.value}>{po.supplierName}</Text>
            <Text style={styles.label}>Contact</Text>
            <Text style={styles.value}>
              {po.supplierContactPerson} · {po.supplierPhone}
            </Text>
            {po.supplierAddress && (
              <>
                <Text style={styles.label}>Address</Text>
                <Text style={styles.value}>{po.supplierAddress}</Text>
              </>
            )}
          </View>
          <View style={styles.sectionBlock}>
            <Text style={styles.label}>Deliver To</Text>
            <Text style={styles.value}>{po.warehouseName}</Text>
            <Text style={styles.label}>Order Date</Text>
            <Text style={styles.value}>{dayjs(po.orderDate).format("MMMM D, YYYY")}</Text>
            <Text style={styles.label}>Expected Date</Text>
            <Text style={styles.value}>
              {po.expectedDate ? dayjs(po.expectedDate).format("MMMM D, YYYY") : "—"}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colProduct, styles.headerText]}>Product</Text>
            <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
            <Text style={[styles.colPrice, styles.headerText]}>Unit Price</Text>
            <Text style={[styles.colDiscount, styles.headerText]}>Discount</Text>
            <Text style={[styles.colTax, styles.headerText]}>Tax</Text>
            <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
          </View>
          {po.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colProduct}>
                {item.productName} ({item.sku})
              </Text>
              <Text style={styles.colQty}>
                {item.quantity} {item.unitSymbol}
              </Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.colDiscount}>{formatCurrency(item.discount)}</Text>
              <Text style={styles.colTax}>{formatCurrency(item.tax)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text>{formatCurrency(po.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Discount</Text>
            <Text>-{formatCurrency(po.discountAmount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tax</Text>
            <Text>+{formatCurrency(po.taxAmount)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalText}>Total</Text>
            <Text style={styles.grandTotalText}>{formatCurrency(po.totalAmount)}</Text>
          </View>
        </View>

        {po.notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{po.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Generated {dayjs().format("MMMM D, YYYY h:mm A")} · Supply Chain & Inventory Management System
        </Text>
      </Page>
    </Document>
  );
}
