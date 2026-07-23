"use client";

import { Modal, Typography } from "antd";
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
  return (
    <Modal title={product?.name} open={Boolean(product)} onCancel={onClose} footer={null} destroyOnHidden>
      {product && (
        <div className="flex flex-col items-center gap-6 py-2">
          <div className="flex flex-col items-center gap-2">
            <Typography.Text type="secondary">Barcode</Typography.Text>
            <ProductBarcode value={product.barcode} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Typography.Text type="secondary">QR Code</Typography.Text>
            <ProductQrCode value={product.qrCode} />
          </div>
        </div>
      )}
    </Modal>
  );
}
