import api from './api';
import { Package, Campaign } from '../types/product';

class ProductService {
  /**
   * Get all packages
   */
  async getPackages(): Promise<Package[]> {
    const response = await api.get<any>('/packages/');
    return response.data.results || response.data;
  }

  /**
   * Get package by ID
   */
  async getPackageById(id: number): Promise<Package> {
    const response = await api.get<Package>(`/packages/${id}/`);
    return response.data;
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(): Promise<Campaign[]> {
    const response = await api.get<any>('/campaigns/');
    return response.data.results || response.data;
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: number): Promise<Campaign> {
    const response = await api.get<Campaign>(`/campaigns/${id}/`);
    return response.data;
  }
}

export default new ProductService();
