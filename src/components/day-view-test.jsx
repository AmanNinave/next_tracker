"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { useDateStore, useEventStore } from '../../lib/store';

const DayView = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { openPopover,events, taskSchedules, taskLogs, openEventSummary, viewMode, setTaskLogs } = useEventStore();
  const { userSelectedDate, setDate } = useDateStore();

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(dayjs()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Check if selected date is today
  const isToday = useMemo(() => 
    userSelectedDate.format('DD-MM-YY') === dayjs().format('DD-MM-YY'),
  [userSelectedDate]);

  // Handler for clicking on an empty time slot
  const handleTimeSlotClick = useCallback(() => {
    setDate(userSelectedDate);
    openPopover();
  }, [userSelectedDate, setDate, openPopover]);

  // Render hour markers (24 hours)
  const renderHours = useCallback(() => (
    Array.from({ length: 24 }).map((_, hour) => (
      <div 
        key={`hour-${hour}`}
        className="relative border-b border-gray-200"
        style={{ height: '60px' }}
        // onClick={handleTimeSlotClick}
      >
        <span className="absolute left-2 top-2 text-sm text-gray-500">
          {dayjs().hour(hour).minute(0).format('h A')}
        </span>
      </div>
    ))
  ), [handleTimeSlotClick]);

  // Filter and render events (logs or schedules)
  const renderEvents = useCallback((type, data) => {
    // First filter events for current date and correct time (past for logs, future for schedules)
    if (!data || data.length === 0) return null;

    const filteredEvents = data.filter(event => {
      if (!event.start_time) return false;
      debugger;
      const eventStartDate = dayjs(event.start_time).format('DD-MM-YY');
      const eventEndDate = event.end_time ? dayjs(event.end_time).format('DD-MM-YY') : null;
      
      // Check if event is for the selected date
      const isCorrectDate = eventStartDate === userSelectedDate.format('DD-MM-YY') || !eventEndDate || event.end_time === "Invalid Date" ||
                        eventEndDate === userSelectedDate.format('DD-MM-YY');

      return isCorrectDate;
    });

    // Then render the filtered events
    return filteredEvents.map((event, index) => {
      const originalStart = dayjs(event.start_time);
      
      // Check if event is from previous day, if so set to today at 12:00 AM
      const start = originalStart.isBefore(dayjs().startOf('day')) 
        ? dayjs().startOf('day')  // Today at 00:00
        : originalStart;

      let end = dayjs(event.end_time);
      let isInProgress = false;
      
      // Handle invalid or missing end times
      if (!event.end_time || end.toString() === "Invalid Date") {
        end = dayjs();
        isInProgress = true;
      }
      
      const duration = Math.max(end.diff(start, 'minute'), 15); // Minimum 15 min for visibility
      const top = start.hour() * 60 + start.minute();

      // Calculate event styling based on type and status
      const styles = {
        // Regular events (purple palette)
        events: {
          bg: "bg-amber-400",
          border: "border-amber-300",
          text: "text-amber-900",
          hover: "group-hover:bg-amber-500"
        },
        
        // Task logs (orange/amber palette)
        logs: {
          bg: "bg-amber-500",
          border: "border-amber-400",
          text: "text-white",
          hover: "group-hover:bg-amber-600"
        },
        
        // Scheduled tasks (blue palette)
        schedules: {
          bg: "bg-blue-500", 
          border: "border-blue-400",
          text: "text-white",
          hover: "group-hover:bg-blue-600"
        },
        
        // In-progress tasks (green palette)
        inProgress: {
          bg: "bg-emerald-500",
          border: "border-emerald-400",
          text: "text-white",
          hover: "group-hover:bg-emerald-600"
        },
        
        // Important events (red palette)
        important: {
          bg: "bg-rose-500",
          border: "border-rose-400", 
          text: "text-white",
          hover: "group-hover:bg-rose-600"
        },
        
        // Personal events (indigo palette)
        personal: {
          bg: "bg-indigo-500",
          border: "border-indigo-400",
          text: "text-white",
          hover: "group-hover:bg-indigo-600"
        },
        
        // Meetings (teal palette)
        meetings: {
          bg: "bg-teal-500",
          border: "border-teal-400",
          text: "text-white",
          hover: "group-hover:bg-teal-600"
        },
        
        // Breaks/Time off (gray palette)
        breaks: {
          bg: "bg-slate-400",
          border: "border-slate-300",
          text: "text-slate-900",
          hover: "group-hover:bg-slate-500"
        }
      };
      
      // Choose the right style
      const style = isInProgress ? styles.inProgress : styles[type];
      
      // Calculate width and position based on view mode
      let width, left;
      const baseLeft = 90;
      
      if (viewMode === "both") {
        // Side by side view
        if (type === "logs" || type === "events") {
          width = "calc(50% - 60px)"; // Half width
          left = `${baseLeft}px`;
        } else {
          width = "calc(50% - 60px)"; // Half width
          left = "calc(50% + 30px)"; // Position in right half
        }
      } else {
        // Full width view
        width = "calc(100% - 120px)";
        left = `${baseLeft}px`;
      }

      return (
        <div
          key={`${type}-${index}`}
          className={`absolute ${style.bg} text-white rounded-md p-2 pt-0 text-sm shadow-md border ${style.border} overflow-hidden group transition-opacity hover:opacity-90 ${
            originalStart.isBefore(dayjs().startOf('day')) ? 'ring-2 ring-orange-400 ring-opacity-50' : ''
          }`}
          style={{
            top: `${top}px`,
            height: `${duration}px`,
            width,
            left,
            zIndex: isInProgress ? 10 : 5
          }}
          onClick={(e) => {
            e.stopPropagation();
            if(type === "events"){
              openEventSummary({...event, status: isInProgress ? "in-progress" : "completed"});
            }else if(type === "schedules" ) {
              openEventSummary(event)
            }else {
              let filteredEvent;
              taskSchedules.forEach((schedule) => {
                if (schedule.id === event.task_schedule_id) {
                  filteredEvent = schedule;
                }
              });
              filteredEvent && openEventSummary(filteredEvent);
            }
          }}
        >
          {/* Previous day indicator */}
          {originalStart.isBefore(dayjs().startOf('day')) && (
            <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-xs px-1 py-0.5 flex items-center justify-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Started Yesterday</span>
            </div>
          )}
          
          <div className={`${originalStart.isBefore(dayjs().startOf('day')) ? 'mt-6' : 'mt-1'}`}>
            <strong className="block truncate">{event.task?.title || event.title || "Untitled Task"}</strong>
            
            {/* Remarks display */}
            {event.remarks && (
              <div className="mt-1 text-xs opacity-80 line-clamp-2">
                <svg className="w-3 h-3 mr-1 inline-block" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="italic">{event.remarks}</span>
              </div>
            )}
            {/* Time and duration display */}
            <div className="flex flex-col gap-1 mt-1">
              <span className={`${style.text} text-xs flex items-center`}>
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {originalStart.format('h:mm A')} - {end.format('h:mm A')}
              </span>
              
              {/* Duration display */}
              <span className={`${style.text} text-xs flex items-center opacity-90`}>
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {Math.floor(duration / 60)}h {duration % 60}m
                {isInProgress && (
                  <span className="ml-1 animate-pulse">• Running</span>
                )}
              </span>
            </div>
          </div>
        </div>
      );
    });
  }, [userSelectedDate, openEventSummary, viewMode, taskSchedules, taskLogs]);

  // Current time indicator
  const renderCurrentTime = useCallback(() => {
    const formattedTime = currentTime.format('h:mm A');
    const currentMinutes = currentTime.hour() * 60 + currentTime.minute();
    
    return (
      <div
        className="absolute border-t-2 border-red-500 z-50 pointer-events-none"
        style={{
          top: `${currentMinutes}px`,
          left: '50px',
          width: 'calc(100% - 50px)',
          transition: 'top 0.3s ease'
        }}
      >
        <span className="absolute right-2 text-red-500 text-xs font-medium">
          {formattedTime}
        </span>
      </div>
    );
  }, [currentTime]);

  // Only update current time when tab is visible
  useEffect(() => {
    let interval;
    
    // Function to start the interval
    const startInterval = () => {
      interval = setInterval(() => { setCurrentTime(dayjs())}, 5000);
    };
    
    // Start the interval initially
    startInterval();
    
    // Handle visibility change to save resources when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        // Update immediately when tab becomes visible again
        setCurrentTime(dayjs());
        startInterval();
      }
    };
    
    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  console.log("rendered");
  return (
    <div className="relative w-full h-[calc(100vh-58px)] border border-gray-300 overflow-y-auto">
      {renderHours()}
      
      {/* Only render event types that are enabled in viewMode */}
      {(viewMode === 'schedules' || viewMode === 'both') && renderEvents("schedules", taskSchedules)}
      {(viewMode === 'logs' || viewMode === 'both') && renderEvents("logs", taskLogs)}
      {(viewMode === 'logs' || viewMode === 'both') && renderEvents("events", events)}

      
      {/* Only show current time indicator if viewing today */}
      {isToday && renderCurrentTime()}
    </div>
  );
};

export default DayView;