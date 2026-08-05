"use client";

import { useEffect, useRef, useState } from "react";
import { App, Upload, type UploadProps } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface ProductImageUploadProps {
  /** Already-persisted image URL (e.g. when editing an existing product). */
  value?: string;
  /** Called with the picked file (not yet uploaded), or null if cleared. */
  onFileSelect: (file: File | null) => void;
}

export function ProductImageUpload({ value, onFileSelect }: ProductImageUploadProps) {
  const { message } = App.useApp();
  const t = useTranslations("products.form");
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Only follow external `value` changes when there's no local (unsaved) preview pending.
    if (!objectUrlRef.current) setPreviewUrl(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    if (!ALLOWED_TYPES.has(file.type)) {
      message.error(t("invalidImageType"));
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_FILE_SIZE) {
      message.error(t("imageTooLarge"));
      return Upload.LIST_IGNORE;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    onFileSelect(file);

    return false;
  };

  return (
    <Upload
      listType="picture-card"
      showUploadList={false}
      beforeUpload={beforeUpload}
      accept="image/jpeg,image/png,image/webp"
    >
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={t("productImageAlt")} className="w-full h-full object-cover rounded" />
      ) : (
        <div>
          <PlusOutlined />
          <div className="mt-2 text-xs">{t("upload")}</div>
        </div>
      )}
    </Upload>
  );
}
