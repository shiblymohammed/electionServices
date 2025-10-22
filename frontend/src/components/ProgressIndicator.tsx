import { OrderItem } from '../types/order';

interface ProgressIndicatorProps {
  totalItems: number;
  currentIndex: number;
  items: OrderItem[];
}

const ProgressIndicator = ({ totalItems, currentIndex, items }: ProgressIndicatorProps) => {
  const progressPercentage = ((currentIndex + 1) / totalItems) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Upload Progress</h3>
          <span className="text-sm font-medium text-gray-600">
            {currentIndex + 1} / {totalItems} completed
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {items.map((item, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={item.id}
              className={`flex items-center p-3 rounded-lg border ${
                isCurrent
                  ? 'border-indigo-500 bg-indigo-50'
                  : isCompleted
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0 mr-3">
                {isCompleted ? (
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : isCurrent ? (
                  <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 text-xs font-bold">{index + 1}</span>
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isCurrent
                      ? 'text-indigo-900'
                      : isCompleted
                      ? 'text-green-900'
                      : 'text-gray-700'
                  }`}
                >
                  {item.item_details?.name || 'Item'}
                </p>
                <p
                  className={`text-xs capitalize ${
                    isCurrent
                      ? 'text-indigo-700'
                      : isCompleted
                      ? 'text-green-700'
                      : 'text-gray-500'
                  }`}
                >
                  {item.item_type}
                </p>
              </div>

              {/* Status Label */}
              <div className="flex-shrink-0 ml-3">
                {isCompleted ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                ) : isCurrent ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    In Progress
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Pending
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;
