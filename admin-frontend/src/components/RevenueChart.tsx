import { RevenueTrendData } from '../types/analytics';

interface RevenueChartProps {
  data: RevenueTrendData[];
}

const RevenueChart = ({ data }: RevenueChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No revenue data available
      </div>
    );
  }

  // Calculate max revenue for scaling
  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  return (
    <div className="w-full">
      {/* Chart */}
      <div className="relative h-64 mb-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-600 pr-2">
          <span className="text-right">{formatCurrency(maxRevenue)}</span>
          <span className="text-right">{formatCurrency(maxRevenue * 0.75)}</span>
          <span className="text-right">{formatCurrency(maxRevenue * 0.5)}</span>
          <span className="text-right">{formatCurrency(maxRevenue * 0.25)}</span>
          <span className="text-right">₹0</span>
        </div>

        {/* Chart area */}
        <div className="absolute left-16 right-0 top-0 bottom-0 border-l border-b border-gray-300">
          {/* Grid lines */}
          <div className="absolute inset-0">
            {[0, 25, 50, 75, 100].map((percent) => (
              <div
                key={percent}
                className="absolute left-0 right-0 border-t border-gray-200"
                style={{ bottom: `${percent}%` }}
              />
            ))}
          </div>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-around px-2">
            {data.map((item, index) => {
              const heightPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              return (
                <div
                  key={index}
                  className="flex-1 mx-1 group relative"
                  style={{ maxWidth: '60px' }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                      <div className="font-semibold">{item.month_label}</div>
                      <div className="mt-1">Revenue: ₹{item.revenue.toLocaleString('en-IN')}</div>
                      <div>Orders: {item.order_count}</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex items-center justify-around pl-16">
        {data.map((item, index) => {
          // Show abbreviated month labels
          const monthShort = item.month_label.split(' ')[0].substring(0, 3);
          return (
            <div
              key={index}
              className="flex-1 text-center text-xs text-gray-600"
              style={{ maxWidth: '60px' }}
            >
              {monthShort}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-t from-blue-600 to-blue-400 rounded" />
          <span className="text-gray-700">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-gray-700">Hover for details</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-lg font-semibold text-gray-900">
            ₹{data.reduce((sum, item) => sum + item.revenue, 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-lg font-semibold text-gray-900">
            {data.reduce((sum, item) => sum + item.order_count, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Average/Month</p>
          <p className="text-lg font-semibold text-gray-900">
            ₹{(data.reduce((sum, item) => sum + item.revenue, 0) / data.length).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
