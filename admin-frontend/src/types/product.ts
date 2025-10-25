export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    name?: string;
    phone: string;
  };
  type: 'package' | 'campaign';
}

export interface Package extends Product {
  type: 'package';
  features: string[];
  deliverables: string[];
}

export interface Campaign extends Product {
  type: 'campaign';
  unit: string;
  features: string[];
  deliverables: string[];
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  features: string[];
  deliverables: string[];
  unit?: string; // Only for campaigns
}

export interface ResourceFieldDefinition {
  id: number;
  field_name: string;
  field_type: 'image' | 'text' | 'number' | 'document' | 'phone' | 'date';
  is_required: boolean;
  order: number;
  help_text: string;
  max_file_size_mb?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  allowed_extensions?: string[];
}

export interface ChecklistTemplateItem {
  id: number;
  name: string;
  description: string;
  order: number;
  is_optional: boolean;
  estimated_duration_minutes?: number;
}

export interface ProductImage {
  id: number;
  image: string;
  thumbnail: string;
  is_primary: boolean;
  order: number;
  alt_text: string;
  uploaded_at: string;
}
