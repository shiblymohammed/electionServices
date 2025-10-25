import { useState } from 'react';
import { TopProduct } from '../types/analytics';

interface TopProductsTableProps {
  products: TopProduct[];
}

type SortField = 'product_name' | 'quantity_sold' | 'revenue';
type SortDirection = 'asc' | 'desc';

const TopProductsTable = ({ products }: TopProductsTableProps) => {
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    let aValue: number | string = a[sortField];
    let bValue: number | string = b[sortField];

    if (sortField === 'product_name') {
      aValue = (aValue as string).toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  // Get product type badge color
  const getTypeBadgeColor = (type: string) => {
    return type === 'package' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No product data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('product_name')}
            >
              <div className="flex items-center gap-1">
                Product
                {renderSortIcon('product_name')}
              </div>
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('quantity_sold')}
            >
              <div className="flex items-center justify-end gap-1">
                Quantity
                {renderSortIcon('quantity_sold')}
              </div>
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('revenue')}
            >
              <div className="flex items-center justify-end gap-1">
                Revenue
                {renderSortIcon('revenue')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedProducts.map((product, index) => (
            <tr key={`${product.product_type}-${product.product_id}`} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold text-sm">
                  {index + 1}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{product.product_name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 w-fit ${getTypeBadgeColor(product.product_type)}`}>
                    {product.product_type}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <span className="text-sm font-semibold text-gray-900">{product.quantity_sold}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(product.revenue)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total from top {products.length} products:</span>
          <div className="flex gap-6">
            <span className="font-semibold text-gray-900">
              {sortedProducts.reduce((sum, p) => sum + p.quantity_sold, 0)} units
            </span>
            <span className="font-semibold text-green-600">
              {formatCurrency(sortedProducts.reduce((sum, p) => sum + p.revenue, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopProductsTable;
