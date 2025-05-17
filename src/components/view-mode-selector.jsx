import React from 'react';
import { useEventStore } from '../../lib/store';

const ViewModeSelector = () => {
  const {viewMode, setViewMode} = useEventStore();
  return (
    <div className="inline-flex rounded-md shadow-sm" role="group">
      <button
        type="button"
        onClick={() => setViewMode('both')}
        className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
          viewMode === 'both'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
        }`}
      >
        All Events
      </button>
      <button
        type="button"
        onClick={() => setViewMode('schedules')}
        className={`px-4 py-2 text-sm font-medium ${
          viewMode === 'schedules'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 border-y border-r border-gray-300 hover:bg-gray-100'
        }`}
      >
        Schedules
      </button>
      <button
        type="button"
        onClick={() => setViewMode('logs')}
        className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
          viewMode === 'logs'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
        }`}
      >
        Logs
      </button>
    </div>
  );
};

export default ViewModeSelector;