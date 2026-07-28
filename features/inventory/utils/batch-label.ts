import dayjs from "dayjs";
import type { InventoryBatchOption } from "@/types/inventory.types";

export function batchLabel(batch: InventoryBatchOption): string {
  const parts = [batch.batchNumber ? `Batch ${batch.batchNumber}` : "No batch"];
  parts.push(`${batch.quantity} available`);
  if (batch.expiryDate) parts.push(`exp. ${dayjs(batch.expiryDate).format("MMM D, YYYY")}`);
  return parts.join(" · ");
}
