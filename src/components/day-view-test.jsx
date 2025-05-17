"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { useDateStore, useEventStore } from '../../lib/store';

const DayView = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { openPopover, taskSchedules, taskLogs, openEventSummary, viewMode } = useEventStore();
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
        onClick={handleTimeSlotClick}
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
    const filteredEvents = data.filter(event => {
      if (!event.start_time) return false;
      
      const eventDate = dayjs(event.start_time).format('DD-MM-YY');
      const isCorrectDate = eventDate === userSelectedDate.format('DD-MM-YY');
      
      if (!isCorrectDate) return false;
      
      // const eventStartTime = dayjs(event.start_time);
      // const eventEndTime = dayjs(event.end_time);
      
      // if (type === "logs") {
      //   return eventStartTime.isBefore(dayjs());
      // }
      
      // if (type === "schedules") {
      //   return eventEndTime.isAfter(dayjs());
      // }
      
      return true;
    });
    console.log("Filtered Events: ",type, filteredEvents);
    // Then render the filtered events
    return filteredEvents.map((event, index) => {
      const start = dayjs(event.start_time);
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
        logs: {
          bg: "bg-red-500",
          border: "border-red-300",
          text: "text-gray-100"
        },
        schedules: {
          bg: "bg-blue-500", 
          border: "border-blue-300",
          text: "text-gray-200"
        },
        inProgress: {
          bg: "bg-green-500",
          border: "border-green-300",
          text: "text-gray-100"
        }
      };
      
      // Choose the right style
      const style = isInProgress ? styles.inProgress : styles[type];
      
      // Calculate width and position based on view mode
      let width, left;
      const baseLeft = 90;
      
      if (viewMode === "both") {
        // Side by side view
        if (type === "logs") {
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
          className={`absolute ${style.bg} text-white rounded-md p-2 pt-0 text-sm shadow-md border ${style.border} overflow-hidden group transition-opacity hover:opacity-90`}
          style={{
            top: `${top}px`,
            height: `${duration}px`,
            width,
            left,
            zIndex: isInProgress ? 10 : 5
          }}
          onClick={(e) => {
            e.stopPropagation();
            type === "schedules" && openEventSummary(event);
          }}
        >
          <strong className="block truncate">{event.task?.title || "Untitled Task"}</strong>
          <span className={`${style.text} text-xs`}>
            {start.format('h:mm A')} - {end.format('h:mm A')}
          </span>
        </div>
      );
    });
  }, [userSelectedDate, openEventSummary, viewMode]);

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

  return (
    <div className="relative w-full h-[calc(100vh-58px)] border border-gray-300 overflow-y-auto">
      {renderHours()}
      
      {/* Only render event types that are enabled in viewMode */}
      {(viewMode === 'schedules' || viewMode === 'both') && renderEvents("schedules", taskSchedules)}
      {(viewMode === 'logs' || viewMode === 'both') && renderEvents("logs", taskLogs)}
      
      {/* Only show current time indicator if viewing today */}
      {isToday && renderCurrentTime()}
    </div>
  );
};

export default DayView;