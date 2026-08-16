import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import dayjs from "dayjs";
import { formatNumber } from "@/lib/utils/format";
import type { PurchaseOrderDetail } from "@/types/purchase-order.types";
import type { CompanyProfile } from "@/types/settings.types";

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
  headerText: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  notes: { marginTop: 20, fontSize: 9, color: "#666666" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 8, color: "#999999", textAlign: "center" },
});

export function PurchaseOrderDocument({ po, company }: { po: PurchaseOrderDetail; company: CompanyProfile }) {
  return (
    <Document title={`Purchase Order ${po.poNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{company.companyName}</Text>
            <Text style={styles.subtitle}>Purchase Order</Text>
            {company.companyAddress && <Text style={styles.subtitle}>{company.companyAddress}</Text>}
            {(company.companyPhone || company.companyEmail) && (
              <Text style={styles.subtitle}>{[company.companyPhone, company.companyEmail].filter(Boolean).join(" · ")}</Text>
            )}
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
          </View>
          {po.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colProduct}>
                {item.productName} ({item.sku})
              </Text>
              <Text style={styles.colQty}>
                {item.quantity} {item.unitSymbol}
              </Text>
            </View>
          ))}
        </View>

        {(po.chequeNumber || po.chequeBankName || po.chequeDate || po.chequeAmount) && (
          <View style={styles.section}>
            <Text style={styles.label}>Cheque Details</Text>
            <Text style={styles.value}>
              {[
                po.chequeNumber && `No. ${po.chequeNumber}`,
                po.chequeBankName,
                po.chequeDate && dayjs(po.chequeDate).format("MMM D, YYYY"),
                po.chequeAmount != null && `Amount: ${formatNumber(po.chequeAmount)}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
        )}

        {po.notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{po.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Generated {dayjs().format("MMMM D, YYYY h:mm A")} · {company.companyName}
        </Text>
      </Page>
    </Document>
  );
}
