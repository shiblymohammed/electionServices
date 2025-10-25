import api from './api';
import {
  AnalyticsOverview,
  RevenueTrendData,
  TopProduct,
  StaffPerformance,
  OrderStatusDistribution,
} from '../types/analytics';

// Get analytics overview
export const getAnalyticsOverview = async (
  startDate?: string,
  endDate?: string
): Promise<AnalyticsOverview> => {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await api.get('/admin/analytics/overview/', { params });
  return response.data.data;
};

// Get revenue trend
export const getRevenueTrend = async (months: number = 12): Promise<RevenueTrendData[]> => {
  const response = await api.get('/admin/analytics/revenue-trend/', {
    params: { months },
  });
  return response.data.data;
};

// Get top products
export const getTopProducts = async (
  limit: number = 5,
  startDate?: string,
  endDate?: string
): Promise<TopProduct[]> => {
  const params: any = { limit };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await api.get('/admin/analytics/top-products/', { params });
  return response.data.data;
};

// Get staff performance
export const getStaffPerformance = async (
  startDate?: string,
  endDate?: string
): Promise<StaffPerformance[]> => {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await api.get('/admin/analytics/staff-performance/', { params });
  return response.data.data;
};

// Get order distribution
export const getOrderDistribution = async (
  startDate?: string,
  endDate?: string
): Promise<OrderStatusDistribution> => {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await api.get('/admin/analytics/order-distribution/', { params });
  return response.data.data;
};

// Export analytics as CSV
export const exportAnalytics = async (startDate?: string, endDate?: string): Promise<void> => {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await api.get('/admin/analytics/export/', {
    params,
    responseType: 'blob',
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  link.setAttribute('download', `analytics_export_${timestamp}.csv`);
  
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
