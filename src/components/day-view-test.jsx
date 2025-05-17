"use client";
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useDateStore, useEventStore } from './../../lib/store';

const App = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { openPopover, taskSchedules, taskLogs, openEventSummary } = useEventStore();
  const { userSelectedDate, setDate } = useDateStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isToday = () => {
    return userSelectedDate.format('DD-MM-YY') === dayjs().format('DD-MM-YY');
  };

  const renderHours = () => {
    return Array.from({ length: 24 }).map((_, i) => (
      <div 
        key={i}
        className="relative border-b border-gray-200"
        style={{ height: '60px', boxSizing: 'border-box' }}
        onClick={() => {
          setDate(userSelectedDate);
          openPopover();
        }}
      >
        <span className="absolute left-2 top-2 text-sm text-gray-500">
          {dayjs().hour(i).minute(0).format('h A')}
        </span>
      </div>
    ));
  };

  const renderEvents = (type , data ) => {
    debugger;
    const filteredEvents = data.filter(event => {
      const eventDate = dayjs(event.start_time).format('DD-MM-YY');
      const isCorrectDate = eventDate === userSelectedDate.format('DD-MM-YY');
      
      if (!isCorrectDate) return false;
      
      const eventStartTime = dayjs(event.start_time);
      const eventEndTime = dayjs(event.end_time);
      
      // For logs: show only events before current time
      if (type === "logs") {
        return eventStartTime.isBefore(dayjs());
      }
      
      // For schedules: show only events after current time
      if (type === "schedules") {
        return eventEndTime.isAfter(dayjs());
      }
      
      return true;
    });
    
    return filteredEvents.map((event, index) => {
      let start = dayjs(event.start_time);
      let end = dayjs(event.end_time);
      let duration = end.diff(start, 'minute');
      let top = start.hour() * 60 + start.minute();

      // Only check for overlapping with same type of events
      const overlappingEvents = data.filter(e => {
        const eStart = dayjs(e.start_time);
        const eEnd = dayjs(e.end_time);
        return (
          eStart.isBefore(end) &&
          eEnd.isAfter(start) &&
          e !== event
        );
      });

      let width = 'calc(100% - 120px)';
      let left = '90px';

      // Add color based on type
      let bgColor = type === "logs" ? "bg-red-500" : "bg-blue-500";
      let borderColor = type === "logs" ? "border-red-300" : "border-blue-300";
      let textColor = type === "logs" ? "text-gray-100" : "text-gray-200";

      if(event.end_time == "Invalid Date" ) {
        
        bgColor = "bg-green-500";
        borderColor = "border-green-300";
        textColor = "text-gray-100";

        end = dayjs(new Date());
        duration = end.diff(start, 'minute');

      }

      // if (overlappingEvents.length > 0) {
      //   width = `calc((100% - 120px) / ${overlappingEvents.length + 1})`;
      //   left = `${90 + overlappingEvents.findIndex(e => e === event) * parseFloat(width)}px`;
      // }

      return (
        <div
          key={`${type}-${index}`}
          className={`absolute ${bgColor} text-white rounded-md p-2 pt-0 text-sm shadow-md border ${borderColor} overflow-hidden group`}
          style={{
            top: `${top}px`,
            height: `${duration}px`,
            width: width,
            left: overlappingEvents.length > 0 && false ? left : '90px',
          }}
          onClick={(e) => {
            e.stopPropagation();
            type === "schedules" && openEventSummary(event);
          }}
        >
          <strong>{event.task?.title || "Untitled Task"}</strong>
          <br />
          <span className={`${textColor} text-xs`}>
            {start.format('h:mm A')} - {end.format('h:mm A')}
          </span>
        </div>
      );
    });
  };

  const formattedTime = currentTime.format('h:mm A');
  const currentHourPosition = currentTime.hour() * 60 + currentTime.minute();

  const renderCurrentTime = () => {
    let width = 'calc(100% - 50px)';
    return (
      <div
        className="absolute border-t-2 border-red-500 z-50 pointer-events-none"
        style={{
          top: `${currentHourPosition}px`,
          left: '50px',
          width
        }}
      >
        <span className="absolute right-2 text-red-500 text-xs">
          {formattedTime}
        </span>
      </div>
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] border border-gray-300 overflow-y-auto">
      {renderHours()}
      {renderEvents("schedules",taskSchedules)}
      {renderEvents("logs",taskLogs)}
      {renderCurrentTime()}
    </div>
  );
};

export default App;
