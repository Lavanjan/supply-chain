export interface WarehouseListItem {
  id: string;
  name: string;
  code: string;
  address: string | null;
  managerName: string | null;
  phone: string | null;
  isActive: boolean;
  inventoryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}
