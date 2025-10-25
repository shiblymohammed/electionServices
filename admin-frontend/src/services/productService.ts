import api from './api';
import { Product, Package, Campaign, ProductFormData } from '../types/product';

// Get all products (packages + campaigns)
export const getAllProducts = async (): Promise<Product[]> => {
  const response = await api.get('/admin/products/');
  return response.data;
};

// Get package by ID
export const getPackage = async (id: number): Promise<Package> => {
  const response = await api.get(`/admin/products/package/${id}/`);
  return response.data;
};

// Get campaign by ID
export const getCampaign = async (id: number): Promise<Campaign> => {
  const response = await api.get(`/admin/products/campaign/${id}/`);
  return response.data;
};

// Create package
export const createPackage = async (data: ProductFormData): Promise<Package> => {
  const response = await api.post('/admin/products/package/', data);
  return response.data;
};

// Create campaign
export const createCampaign = async (data: ProductFormData): Promise<Campaign> => {
  const response = await api.post('/admin/products/campaign/', data);
  return response.data;
};

// Update package
export const updatePackage = async (id: number, data: ProductFormData): Promise<Package> => {
  const response = await api.put(`/admin/products/package/${id}/update/`, data);
  return response.data;
};

// Update campaign
export const updateCampaign = async (id: number, data: ProductFormData): Promise<Campaign> => {
  const response = await api.put(`/admin/products/campaign/${id}/update/`, data);
  return response.data;
};

// Delete package
export const deletePackage = async (id: number): Promise<void> => {
  await api.delete(`/admin/products/package/${id}/`);
};

// Delete campaign
export const deleteCampaign = async (id: number): Promise<void> => {
  await api.delete(`/admin/products/campaign/${id}/`);
};

// Toggle product status
export const toggleProductStatus = async (
  type: 'package' | 'campaign',
  id: number
): Promise<Product> => {
  const response = await api.patch(`/admin/products/${type}/${id}/toggle-status/`);
  return response.data;
};

// Resource Field Management
import { ResourceFieldDefinition } from '../types/product';

export const getResourceFields = async (
  type: 'package' | 'campaign',
  id: number
): Promise<ResourceFieldDefinition[]> => {
  const response = await api.get(`/admin/products/${type}/${id}/resource-fields/`);
  return response.data.fields || response.data;
};

export const createResourceField = async (
  type: 'package' | 'campaign',
  id: number,
  data: Partial<ResourceFieldDefinition>
): Promise<ResourceFieldDefinition> => {
  const response = await api.post(`/admin/products/${type}/${id}/resource-fields/`, data);
  return response.data.field || response.data;
};

export const updateResourceField = async (
  fieldId: number,
  data: Partial<ResourceFieldDefinition>
): Promise<ResourceFieldDefinition> => {
  const response = await api.put(`/admin/products/resource-fields/${fieldId}/`, data);
  return response.data.field || response.data;
};

export const deleteResourceField = async (fieldId: number): Promise<void> => {
  await api.delete(`/admin/products/resource-fields/${fieldId}/`);
};

export const reorderResourceFields = async (
  fieldIds: number[]
): Promise<{ success: boolean }> => {
  const response = await api.patch('/admin/products/resource-fields/reorder/', {
    field_ids: fieldIds,
  });
  return response.data;
};

// Checklist Template Management
import { ChecklistTemplateItem } from '../types/product';

export const getChecklistTemplate = async (
  type: 'package' | 'campaign',
  id: number
): Promise<ChecklistTemplateItem[]> => {
  const response = await api.get(`/admin/products/${type}/${id}/checklist-template/`);
  return response.data;
};

export const createChecklistItem = async (
  type: 'package' | 'campaign',
  id: number,
  data: Partial<ChecklistTemplateItem>
): Promise<ChecklistTemplateItem> => {
  const response = await api.post(`/admin/products/${type}/${id}/checklist-template/`, data);
  return response.data;
};

export const updateChecklistItem = async (
  itemId: number,
  data: Partial<ChecklistTemplateItem>
): Promise<ChecklistTemplateItem> => {
  const response = await api.put(`/admin/products/checklist-template/${itemId}/`, data);
  return response.data;
};

export const deleteChecklistItem = async (itemId: number): Promise<void> => {
  await api.delete(`/admin/products/checklist-template/${itemId}/`);
};

export const reorderChecklistItems = async (
  itemIds: number[]
): Promise<{ success: boolean }> => {
  const response = await api.patch('/admin/products/checklist-template/reorder/', {
    item_ids: itemIds,
  });
  return response.data;
};

// Product Image Management
import { ProductImage } from '../types/product';

export const getProductImages = async (
  type: 'package' | 'campaign',
  id: number
): Promise<ProductImage[]> => {
  const response = await api.get(`/products/${type}/${id}/images/`);
  return response.data;
};

export const uploadProductImage = async (
  type: 'package' | 'campaign',
  id: number,
  formData: FormData
): Promise<ProductImage> => {
  const response = await api.post(`/admin/products/${type}/${id}/images/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateProductImage = async (
  imageId: number,
  data: Partial<ProductImage>
): Promise<ProductImage> => {
  const response = await api.put(`/admin/products/images/${imageId}/`, data);
  return response.data;
};

export const deleteProductImage = async (imageId: number): Promise<void> => {
  await api.delete(`/admin/products/images/${imageId}/`);
};

export const reorderProductImages = async (
  imageIds: number[]
): Promise<{ success: boolean }> => {
  const response = await api.patch('/admin/products/images/reorder/', {
    image_ids: imageIds,
  });
  return response.data;
};

export const setPrimaryImage = async (imageId: number): Promise<ProductImage> => {
  const response = await api.patch(`/admin/products/images/${imageId}/set-primary/`);
  return response.data;
};
