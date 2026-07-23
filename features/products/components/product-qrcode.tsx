"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Empty, Skeleton } from "antd";

export function ProductQrCode({ value, size = 160 }: { value: string | null; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!value) return <Empty description="No QR code" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  if (!dataUrl) return <Skeleton.Image active style={{ width: size, height: size }} />;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt={`QR code ${value}`} width={size} height={size} />;
}
