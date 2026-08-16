-- Track wastage separately from received quantity on each GRN line item.
ALTER TABLE "goods_receive_items" ADD COLUMN "wastedQuantity" DECIMAL(12,2) NOT NULL DEFAULT 0;
