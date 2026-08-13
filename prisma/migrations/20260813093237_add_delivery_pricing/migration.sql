-- AlterTable: add price fields as nullable first so existing rows can be backfilled
ALTER TABLE "delivery_items" ADD COLUMN "unitPrice" DECIMAL(12,2);
ALTER TABLE "delivery_items" ADD COLUMN "totalPrice" DECIMAL(12,2);

-- Backfill: unit price from the product's current selling price, total = quantity * unitPrice
UPDATE "delivery_items" di
SET "unitPrice" = p."sellingPrice"
FROM "products" p
WHERE di."productId" = p.id;

UPDATE "delivery_items"
SET "unitPrice" = 0
WHERE "unitPrice" IS NULL;

UPDATE "delivery_items"
SET "totalPrice" = ROUND(quantity * "unitPrice", 2);

-- Enforce NOT NULL going forward
ALTER TABLE "delivery_items" ALTER COLUMN "unitPrice" SET NOT NULL;
ALTER TABLE "delivery_items" ALTER COLUMN "totalPrice" SET NOT NULL;

-- AlterTable: delivery header total
ALTER TABLE "deliveries" ADD COLUMN "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Backfill delivery totals from their items
UPDATE "deliveries" d
SET "totalAmount" = sub.total
FROM (
    SELECT "deliveryId", SUM("totalPrice") AS total
    FROM "delivery_items"
    GROUP BY "deliveryId"
) sub
WHERE d.id = sub."deliveryId";
