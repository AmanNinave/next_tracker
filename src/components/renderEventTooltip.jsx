// Add this render function in your component:
const renderEventTooltip = useCallback(() => {
  if (!hoveredEvent) return null;

  return (
    <div
      className="fixed z-[100] bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-sm pointer-events-none"
      style={{
        left: `${hoverPosition.x}px`,
        top: `${hoverPosition.y}px`,
        transform: 'translateY(-50%)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            hoveredEvent.isInProgress ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}></div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            hoveredEvent.type === 'schedules' ? 'bg-blue-100 text-blue-700' :
            hoveredEvent.type === 'logs' ? 'bg-amber-100 text-amber-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {hoveredEvent.type === 'schedules' ? 'Scheduled' :
             hoveredEvent.type === 'logs' ? 'Activity Log' : 'Event'}
          </span>
        </div>
        {hoveredEvent.isInProgress && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
            Live
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2 text-base">
        {hoveredEvent.task?.title || hoveredEvent.title || "Untitled Task"}
      </h3>

      {/* Category and Subcategory */}
      {(hoveredEvent.task?.category || hoveredEvent.category) && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
            {hoveredEvent.task?.category || hoveredEvent.category}
          </span>
          {(hoveredEvent.task?.sub_category || hoveredEvent.sub_category) && (
            <>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {hoveredEvent.task?.sub_category || hoveredEvent.sub_category}
              </span>
            </>
          )}
        </div>
      )}

      {/* Description */}
      {(hoveredEvent.task?.description || hoveredEvent.description) && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 line-clamp-3">
            {hoveredEvent.task?.description || hoveredEvent.description}
          </p>
        </div>
      )}

      {/* Remarks */}
      {hoveredEvent.remarks && (
        <div className="mb-3 p-2 bg-gray-50 rounded-md">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1">Remarks</p>
              <p className="text-sm text-gray-600 italic">"{hoveredEvent.remarks}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Time Information */}
      <div className="space-y-2 text-sm text-gray-600">
        {/* Original vs Adjusted Start Time */}
        {hoveredEvent.originalStart.isBefore(dayjs().startOf('day')) && (
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-md">
            <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs font-medium text-orange-700">Started Yesterday</p>
              <p className="text-xs text-orange-600">
                Original: {hoveredEvent.originalStart.format('MMM D, h:mm A')}
              </p>
            </div>
          </div>
        )}

        {/* Time Range */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span>
            {hoveredEvent.adjustedStart.format('h:mm A')} - {
              hoveredEvent.isInProgress ? 'Now' : hoveredEvent.end.format('h:mm A')
            }
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span>
            {hoveredEvent.duration >= 60 
              ? `${Math.floor(hoveredEvent.duration / 60)}h ${hoveredEvent.duration % 60}m`
              : `${hoveredEvent.duration}m`
            }
            {hoveredEvent.isInProgress && (
              <span className="ml-2 text-green-600 font-medium">• Running</span>
            )}
          </span>
        </div>

        {/* Status */}
        {(hoveredEvent.task?.status || hoveredEvent.status) && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="capitalize">
              {hoveredEvent.task?.status || hoveredEvent.status}
            </span>
          </div>
        )}
      </div>

      {/* Footer with ID */}
      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
        ID: {hoveredEvent.id} • {hoveredEvent.type}
      </div>
    </div>
  );
}, [hoveredEvent, hoverPosition]);

// Add the tooltip to your return statement:
return (
  <div className="relative w-full h-[calc(100vh-58px)] border border-gray-300 overflow-y-auto">
    {renderHours()}
    
    {/* Only render event types that are enabled in viewMode */}
    {(viewMode === 'schedules' || viewMode === 'both') && renderEvents("schedules", taskSchedules)}
    {(viewMode === 'logs' || viewMode === 'both') && renderEvents("logs", taskLogs)}
    {(viewMode === 'logs' || viewMode === 'both') && renderEvents("events", events)}

    {/* Only show current time indicator if viewing today */}
    {isToday && renderCurrentTime()}
    
    {/* Event hover tooltip */}
    {renderEventTooltip()}
  </div>
);