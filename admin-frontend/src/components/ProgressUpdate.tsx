import { useState, useEffect } from 'react';
import { ChecklistItem as ChecklistItemType } from '../types/order';
import { updateChecklistItem } from '../services/staffService';

/**
 * ProgressUpdate Component
 * 
 * Provides interactive progress tracking and checklist item updates for staff members.
 * Features:
 * - Update checklist items via API
 * - Show real-time progress percentage
 * - Display completion timestamps
 * - Show success notification when order is complete
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
interface ProgressUpdateProps {
  checklistItems: ChecklistItemType[];
  onUpdate?: () => void;
}

interface UpdateResponse {
  success: boolean;
  message: string;
  order_progress: {
    total_items: number;
    completed_items: number;
    progress_percentage: number;
    order_status: string;
  };
}

const ProgressUpdate = ({ checklistItems, onUpdate }: ProgressUpdateProps) => {
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<UpdateResponse['order_progress'] | null>(null);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);

  // Calculate progress from checklist items
  const calculateProgress = () => {
    if (!checklistItems || checklistItems.length === 0) {
      return { percentage: 0, completed: 0, total: 0 };
    }
    const completed = checklistItems.filter(item => item.completed).length;
    const total = checklistItems.length;
    const percentage = Math.round((completed / total) * 100);
    return { percentage, completed, total };
  };

  const currentProgress = progressData || {
    progress_percentage: calculateProgress().percentage,
    completed_items: calculateProgress().completed,
    total_items: calculateProgress().total,
    order_status: 'in_progress',
  };

  // Show celebration when order reaches 100%
  useEffect(() => {
    if (currentProgress.progress_percentage === 100 && !showCompletionCelebration) {
      setShowCompletionCelebration(true);
      // Auto-hide celebration after 5 seconds
      const timer = setTimeout(() => {
        setShowCompletionCelebration(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentProgress.progress_percentage]);

  const handleToggleItem = async (item: ChecklistItemType) => {
    try {
      setError(null);
      setSuccessMessage(null);
      setUpdatingItems(prev => new Set(prev).add(item.id));

      const response = await updateChecklistItem(item.id, !item.completed);
      
      // Update progress data from response
      setProgressData(response.order_progress);

      // Show success message
      const action = item.completed ? 'unchecked' : 'completed';
      const message = `Checklist item ${action}. Progress: ${response.order_progress.progress_percentage}%`;
      setSuccessMessage(message);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

      // Notify parent to refresh data
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      console.error('Error updating checklist item:', err);
      setError(err.response?.data?.error?.message || 'Failed to update checklist item');
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!checklistItems || checklistItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Update</h3>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-4 text-gray-600">No checklist items available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Progress Update</h3>
        <span className="text-sm text-gray-600">
          {currentProgress.completed_items} of {currentProgress.total_items} completed
        </span>
      </div>

      {/* Real-time Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Completion Progress</span>
          <span className={`text-sm font-semibold ${
            currentProgress.progress_percentage === 100 ? 'text-green-600' : 'text-blue-600'
          }`}>
            {currentProgress.progress_percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all duration-500 ease-out ${
              currentProgress.progress_percentage === 100 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}
            style={{ width: `${currentProgress.progress_percentage}%` }}
          >
            {currentProgress.progress_percentage > 10 && (
              <div className="h-full flex items-center justify-end pr-2">
                <span className="text-xs font-medium text-white">
                  {currentProgress.progress_percentage}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center animate-fade-in">
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Order Complete Celebration */}
      {showCompletionCelebration && currentProgress.progress_percentage === 100 && (
        <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 animate-bounce-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="relative">
                <svg className="h-12 w-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="absolute -top-1 -right-1">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-bold text-green-800 mb-1">
                🎉 Order Completed Successfully!
              </h3>
              <p className="text-sm text-green-700 mb-2">
                All checklist items have been completed. Excellent work!
              </p>
              <div className="flex items-center text-xs text-green-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Order status updated to: {currentProgress.order_status.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklistItems.map((item) => {
          const isUpdating = updatingItems.has(item.id);
          
          return (
            <div
              key={item.id}
              className={`border rounded-lg p-4 transition-all ${
                item.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start">
                <button
                  onClick={() => handleToggleItem(item)}
                  disabled={isUpdating}
                  className={`flex-shrink-0 mt-0.5 mr-3 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    isUpdating
                      ? 'border-gray-300 bg-gray-100 cursor-wait'
                      : item.completed
                      ? 'border-green-500 bg-green-500 hover:bg-green-600 hover:border-green-600'
                      : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                  aria-label={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {isUpdating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : item.completed ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : null}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      item.completed ? 'text-gray-600 line-through' : 'text-gray-900'
                    }`}
                  >
                    {item.description}
                  </p>
                  
                  {/* Completion Timestamp */}
                  {item.completed && item.completed_at && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>Completed on {formatTimestamp(item.completed_at)}</span>
                      {item.completed_by && (
                        <span className="ml-2">
                          by {item.completed_by.name || item.completed_by.phone}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {item.completed && (
                  <div className="flex-shrink-0 ml-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Done
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>
              {currentProgress.completed_items === currentProgress.total_items
                ? 'All tasks completed'
                : `${currentProgress.total_items - currentProgress.completed_items} task${
                    currentProgress.total_items - currentProgress.completed_items !== 1 ? 's' : ''
                  } remaining`}
            </span>
          </div>
          <div className={`font-semibold ${
            currentProgress.progress_percentage === 100 ? 'text-green-600' : 'text-blue-600'
          }`}>
            {currentProgress.progress_percentage}% Complete
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressUpdate;
