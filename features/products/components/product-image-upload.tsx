"use client";

import { useState } from "react";
import { App, Upload, type UploadProps } from "antd";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";

interface ProductImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
}

export function ProductImageUpload({ value, onChange }: ProductImageUploadProps) {
  const { message } = App.useApp();
  const [uploading, setUploading] = useState(false);

  const customRequest: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file as File);
      const response = await fetch("/api/products/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(body.error ?? "Upload failed");
      }
      const data = await response.json();
      onChange(data.url);
      onSuccess?.(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Upload failed");
      onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Upload
      listType="picture-card"
      showUploadList={false}
      customRequest={customRequest}
      accept="image/jpeg,image/png,image/webp"
    >
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Product" className="w-full h-full object-cover rounded" />
      ) : (
        <div>
          {uploading ? <LoadingOutlined /> : <PlusOutlined />}
          <div className="mt-2 text-xs">Upload</div>
        </div>
      )}
    </Upload>
  );
}
