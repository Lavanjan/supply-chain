"use client";

import { Modal, Typography } from "antd";
import { useTranslations } from "next-intl";
import { ProductBarcode } from "@/features/products/components/product-barcode";
import { ProductQrCode } from "@/features/products/components/product-qrcode";
import type { ProductListItem } from "@/types/product.types";

export function ProductCodesModal({
  product,
  onClose,
}: {
  product: ProductListItem | null;
  onClose: () => void;
}) {
  const t = useTranslations("products.codes");

  return (
    <Modal title={product?.name} open={Boolean(product)} onCancel={onClose} footer={null} destroyOnHidden>
      {product && (
        <div className="flex flex-col items-center gap-6 py-2">
          <div className="flex flex-col items-center gap-2">
            <Typography.Text type="secondary">{t("barcode")}</Typography.Text>
            <ProductBarcode value={product.barcode} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Typography.Text type="secondary">{t("qrCode")}</Typography.Text>
            <ProductQrCode value={product.qrCode} />
          </div>
        </div>
      )}
    </Modal>
  );
}
