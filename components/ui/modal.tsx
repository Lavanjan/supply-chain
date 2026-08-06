"use client";

import { Modal as AntModal, type ModalProps } from "antd";
import { useIsMobile } from "@/hooks/use-is-mobile";

/**
 * Drop-in replacement for antd's `Modal` that goes full-screen on mobile (native
 * app "sheet" feel) instead of just shrinking a fixed-width dialog to fit. Desktop
 * behavior is untouched — every existing `width`/`styles`/etc. prop still applies.
 */
export function Modal({ style, styles, className, width, centered, ...rest }: ModalProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <AntModal style={style} styles={styles} className={className} width={width} centered={centered} {...rest} />
    );
  }

  return (
    <AntModal
      {...rest}
      width="100vw"
      centered={false}
      className={`${className ?? ""} app-mobile-modal`}
      style={{ ...style, top: 0, padding: 0, margin: 0, maxWidth: "100vw" }}
      styles={{
        ...styles,
        wrapper: { ...styles?.wrapper, padding: 0 },
        content: {
          ...styles?.content,
          borderRadius: 0,
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
        },
        header: { ...styles?.header, flex: "0 0 auto", margin: 0, padding: "14px 16px" },
        body: { ...styles?.body, flex: "1 1 auto", overflowY: "auto", padding: "16px" },
        footer: { ...styles?.footer, flex: "0 0 auto", margin: 0, padding: "12px 16px" },
      }}
    />
  );
}
