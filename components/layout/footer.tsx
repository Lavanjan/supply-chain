import { Layout, Typography } from "antd";

const { Footer: AntFooter } = Layout;

export function Footer() {
  return (
    <AntFooter className="!bg-transparent !px-4 sm:!px-6 !py-4 text-center">
      <Typography.Text type="secondary" className="text-xs">
        © {new Date().getFullYear()} Supply Chain & Inventory Management System. All rights
        reserved.
      </Typography.Text>
    </AntFooter>
  );
}
