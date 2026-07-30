import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import dayjs from "dayjs";
import type { DeliveryDetail } from "@/types/delivery.types";
import type { CompanyProfile } from "@/types/settings.types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#171717" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#666666", marginTop: 2 },
  deliveryNumber: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "right" },
  status: { fontSize: 10, textAlign: "right", marginTop: 2, color: "#666666" },
  sectionRow: { flexDirection: "row", gap: 24, marginBottom: 16 },
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

export function DeliveryNoteDocument({ delivery, company }: { delivery: DeliveryDetail; company: CompanyProfile }) {
  return (
    <Document title={`Delivery Note ${delivery.deliveryNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{company.companyName}</Text>
            <Text style={styles.subtitle}>Delivery Note</Text>
            {company.companyAddress && <Text style={styles.subtitle}>{company.companyAddress}</Text>}
            {(company.companyPhone || company.companyEmail) && (
              <Text style={styles.subtitle}>{[company.companyPhone, company.companyEmail].filter(Boolean).join(" · ")}</Text>
            )}
          </View>
          <View>
            <Text style={styles.deliveryNumber}>{delivery.deliveryNumber}</Text>
            <Text style={styles.status}>{delivery.status}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.sectionBlock}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{delivery.customerName}</Text>
            <Text style={styles.label}>Delivery Address</Text>
            <Text style={styles.value}>{delivery.deliveryAddress || "—"}</Text>
          </View>
          <View style={styles.sectionBlock}>
            <Text style={styles.label}>Warehouse</Text>
            <Text style={styles.value}>{delivery.warehouseName}</Text>
            <Text style={styles.label}>Scheduled Date</Text>
            <Text style={styles.value}>{dayjs(delivery.scheduledDate).format("MMMM D, YYYY")}</Text>
            <Text style={styles.label}>Vehicle / Driver</Text>
            <Text style={styles.value}>
              {delivery.vehiclePlateNumber || "—"} · {delivery.driverName || "—"}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colProduct, styles.headerText]}>Product</Text>
            <Text style={[styles.colQty, styles.headerText]}>Quantity</Text>
          </View>
          {delivery.items.map((item) => (
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

        {delivery.notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{delivery.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Generated {dayjs().format("MMMM D, YYYY h:mm A")} · {company.companyName}
        </Text>
      </Page>
    </Document>
  );
}
