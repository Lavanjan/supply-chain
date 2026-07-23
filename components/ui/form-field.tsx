"use client";

import { Controller, type Control, type FieldValues, type Path, type ControllerRenderProps } from "react-hook-form";
import { Form } from "antd";
import type { ReactNode } from "react";

type FieldWithId<T extends FieldValues, K extends Path<T>> = ControllerRenderProps<T, K> & { id: string };

interface FormFieldProps<T extends FieldValues, K extends Path<T>> {
  control: Control<T>;
  name: K;
  label?: ReactNode;
  required?: boolean;
  className?: string;
  children: (field: FieldWithId<T, K>) => ReactNode;
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
          htmlFor={name}
          required={required}
          validateStatus={fieldState.error ? "error" : ""}
          help={fieldState.error?.message}
          className={className}
        >
          {children({ ...field, id: name })}
        </Form.Item>
      )}
    />
  );
}
