"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Empty } from "antd";

export function ProductBarcode({ value, height = 60 }: { value: string | null; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!value || !svgRef.current) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        height,
        displayValue: true,
        fontSize: 14,
        margin: 8,
      });
    } catch {
      // Invalid barcode value for CODE128 — leave the SVG empty rather than throwing.
    }
  }, [value, height]);

  if (!value) return <Empty description="No barcode set" image={Empty.PRESENTED_IMAGE_SIMPLE} />;

  return <svg ref={svgRef} role="img" aria-label={`Barcode ${value}`} />;
}
