export interface OrderStatistics {
  pending: number;
  assigned: number;
  in_progress: number;
  completed: number;
  total: number;
}

export interface AdminOrder {
  id: number;
  order_number: string;
  user: {
    id: number;
    phone: string;
    name?: string;
  };
  total_amount: number;
  status: string;
  assigned_to?: {
    id: number;
    name?: string;
    phone: string;
  };
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  item_type: 'package' | 'campaign';
  item_details: any;
  quantity: number;
  price: number;
  resources_uploaded: boolean;
}

export interface ChecklistItem {
  id: number;
  description: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: {
    id: number;
    name?: string;
    phone: string;
  } | null;
  order_index: number;
}

export interface OrderChecklist {
  id: number;
  total_items: number;
  completed_items: number;
  progress_percentage: number;
  items: ChecklistItem[];
}

export interface OrderDetail extends AdminOrder {
  resources: OrderResource[];
  checklist?: OrderChecklist;
}

export interface OrderResource {
  id: number;
  resource_type?: string;
  file_url?: string;
  candidate_photo?: string;
  party_logo?: string;
  campaign_slogan?: string;
  preferred_date?: string;
  whatsapp_number?: string;
  additional_notes?: string;
  uploaded_at: string;
}

export interface StaffMember {
  id: number;
  name?: string;
  phone: string;
  assigned_orders_count: number;
}
