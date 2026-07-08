export interface RawMaterial {
  id: string;
  name: string;
  stock: number;
  unit: string;
}

export interface BOMItem {
  materialId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  bom: BOMItem[];
}

export interface AllocationResult {
  materialId: string;
  required: number;
  available: number;
  shortage: number;
}

export interface SPKItem {
  productId: string;
  quantity: number;
}

export interface WorkOrder {
  id: string;
  spkNumber: string;
  items: SPKItem[];
  status: 'DRAFT' | 'ALLOCATED';
  date: string;
  allocations: AllocationResult[];
}
