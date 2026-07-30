"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Button, Card, Input, Typography } from "antd";
import { FormField } from "@/components/ui/form-field";
import { settingsSchema, type SettingsInput } from "@/lib/validations/settings.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import type { CompanyProfile } from "@/types/settings.types";

interface SettingsFormProps {
  initialSettings: CompanyProfile;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const { message } = App.useApp();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialSettings,
  });

  async function onSubmit(values: SettingsInput) {
    try {
      const updated = await apiClient.patch<CompanyProfile>("/api/settings", values);
      reset(updated);
      message.success("Settings saved");
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Unable to save settings");
    }
  }

  return (
    <Card title="Company Profile" className="rounded-2xl max-w-2xl">
      <Typography.Paragraph type="secondary" className="text-sm">
        This information appears on generated Purchase Order, Goods Receive Note, and Delivery Note PDFs.
      </Typography.Paragraph>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField control={control} name="companyName" label="Company Name" required>
          {(field) => <Input {...field} status={errors.companyName ? "error" : ""} placeholder="Your company name" />}
        </FormField>

        <FormField control={control} name="companyAddress" label="Address">
          {(field) => <Input.TextArea {...field} rows={2} placeholder="Company address" />}
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="companyPhone" label="Phone">
            {(field) => <Input {...field} placeholder="Company phone" />}
          </FormField>

          <FormField control={control} name="companyEmail" label="Email">
            {(field) => <Input {...field} status={errors.companyEmail ? "error" : ""} placeholder="Company email" />}
          </FormField>
        </div>

        <div className="flex justify-end mt-2">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
