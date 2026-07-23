"use client";

import { Controller, type Control, type FieldValues, type Path, type ControllerRenderProps } from "react-hook-form";
import { Form } from "antd";
import type { ReactNode } from "react";

interface FormFieldProps<T extends FieldValues, K extends Path<T>> {
  control: Control<T>;
  name: K;
  label?: ReactNode;
  required?: boolean;
  className?: string;
  children: (field: ControllerRenderProps<T, K>) => ReactNode;
}

export function FormField<T extends FieldValues, K extends Path<T>>({
  control,
  name,
  label,
  required,
  className,
  children,
}: FormFieldProps<T, K>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Form.Item
          label={label}
          required={required}
          validateStatus={fieldState.error ? "error" : ""}
          help={fieldState.error?.message}
          className={className}
        >
          {children(field)}
        </Form.Item>
      )}
    />
  );
}
