import { DeploymentUnitOutlined } from "@ant-design/icons";

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-lg">
        <DeploymentUnitOutlined />
      </div>
      {!collapsed && (
        <span className="whitespace-nowrap text-sm font-semibold leading-tight">
          Rajan Suppliers
          <br />
          <span className="text-xs font-normal text-neutral-500">Inventory System</span>
        </span>
      )}
    </div>
  );
}
