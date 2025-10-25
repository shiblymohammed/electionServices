export interface PackageItem {
  id: number;
  name: string;
  quantity: number;
}

export interface ProductImage {
  id: number;
  image: string;
  thumbnail: string;
  is_primary: boolean;
  order: number;
  alt_text: string;
}

export interface Package {
  id: number;
  name: string;
  price: number;
  description: string;
  items: PackageItem[];
  is_active: boolean;
  created_at: string;
  images?: ProductImage[];
}

export interface Campaign {
  id: number;
  name: string;
  price: number;
  unit: string;
  description: string;
  is_active: boolean;
  created_at: string;
  images?: ProductImage[];
}

export type Product = Package | Campaign;

export function isPackage(product: Product): product is Package {
  return 'items' in product;
}

export function isCampaign(product: Product): product is Campaign {
  return 'unit' in product;
}
