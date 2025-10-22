export interface PackageItem {
  id: number;
  name: string;
  quantity: number;
}

export interface Package {
  id: number;
  name: string;
  price: number;
  description: string;
  items: PackageItem[];
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  id: number;
  name: string;
  price: number;
  unit: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export type Product = Package | Campaign;

export function isPackage(product: Product): product is Package {
  return 'items' in product;
}

export function isCampaign(product: Product): product is Campaign {
  return 'unit' in product;
}
