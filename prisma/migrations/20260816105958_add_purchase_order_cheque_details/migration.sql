-- Optional cheque payment details for purchase orders.
ALTER TABLE "purchase_orders" ADD COLUMN "chequeNumber" TEXT;
ALTER TABLE "purchase_orders" ADD COLUMN "chequeBankName" TEXT;
ALTER TABLE "purchase_orders" ADD COLUMN "chequeDate" TIMESTAMP(3);
ALTER TABLE "purchase_orders" ADD COLUMN "chequeAmount" DECIMAL(12,2);
