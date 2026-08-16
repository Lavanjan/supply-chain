-- This app now tracks inventory quantity only — drop every price/money column.

ALTER TABLE "products" DROP COLUMN "purchasePrice";
ALTER TABLE "products" DROP COLUMN "sellingPrice";

ALTER TABLE "purchase_orders" DROP COLUMN "subtotal";
ALTER TABLE "purchase_orders" DROP COLUMN "discountAmount";
ALTER TABLE "purchase_orders" DROP COLUMN "taxAmount";
ALTER TABLE "purchase_orders" DROP COLUMN "totalAmount";

ALTER TABLE "purchase_items" DROP COLUMN "unitPrice";
ALTER TABLE "purchase_items" DROP COLUMN "discount";
ALTER TABLE "purchase_items" DROP COLUMN "tax";
ALTER TABLE "purchase_items" DROP COLUMN "totalPrice";

ALTER TABLE "goods_receive_items" DROP COLUMN "unitPrice";

ALTER TABLE "deliveries" DROP COLUMN "totalAmount";

ALTER TABLE "delivery_items" DROP COLUMN "unitPrice";
ALTER TABLE "delivery_items" DROP COLUMN "totalPrice";
