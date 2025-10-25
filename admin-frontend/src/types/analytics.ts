// Analytics types
export interface RevenueMetrics {
  total_revenue: number;
  order_count: number;
  average_order_value: number;
}

export interface ConversionMetrics {
  total_orders: number;
  paid_orders: number;
  conversion_rate: number;
}

export interface OrderStatusDistribution {
  [key: string]: {
    label: string;
    count: number;
  };
}

export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface AnalyticsOverview {
  revenue: RevenueMetrics;
  conversion: ConversionMetrics;
  order_distribution: OrderStatusDistribution;
  date_range: DateRange;
}

export interface RevenueTrendData {
  month: string;
  month_label: string;
  revenue: number;
  order_count: number;
}

export interface TopProduct {
  product_id: number;
  product_type: 'package' | 'campaign';
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

export interface StaffPerformance {
  staff_id: number;
  staff_name: string;
  phone_number: string;
  role: string;
  assigned_orders: number;
  completed_orders: number;
  completion_rate: number;
}
