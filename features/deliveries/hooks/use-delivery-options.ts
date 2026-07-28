"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { WarehouseOption } from "@/types/warehouse.types";
import type { VehicleOption } from "@/types/vehicle.types";
import type { DriverOption } from "@/types/driver.types";

export interface CustomerOption {
  id: string;
  companyName: string;
  address: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
}

export function useDeliveryOptions() {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiClient.get<CustomerOption[]>("/api/customers/options"),
      apiClient.get<WarehouseOption[]>("/api/warehouses/options"),
      apiClient.get<VehicleOption[]>("/api/vehicles/options"),
      apiClient.get<DriverOption[]>("/api/drivers/options"),
      apiClient.get<ProductOption[]>("/api/products/select-options"),
    ])
      .then(([customerResult, warehouseResult, vehicleResult, driverResult, productResult]) => {
        if (cancelled) return;
        setCustomers(customerResult);
        setWarehouses(warehouseResult);
        setVehicles(vehicleResult);
        setDrivers(driverResult);
        setProducts(productResult);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { customers, warehouses, vehicles, drivers, products, loading };
}
