import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useDateStore, useEventStore } from './../../lib/store';

const App = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { openPopover, events, openEventSummary } = useEventStore();
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

  const renderEvents = () => {
    const filteredEvents = events.filter(event => {
      const eventDate = dayjs(event.plannedStartTime).format('DD-MM-YY');
      return eventDate === userSelectedDate.format('DD-MM-YY');
    });

    return filteredEvents.map((event, index) => {
      const start = dayjs(event.plannedStartTime);
      const end = dayjs(event.plannedEndTime);
      const duration = end.diff(start, 'minute');
      const top = start.hour() * 60 + start.minute();

      const overlappingEvents = events.filter(e => {
        const eStart = dayjs(e.plannedStartTime);
        const eEnd = dayjs(e.plannedEndTime);
        return (
          eStart.isBefore(end) &&
          eEnd.isAfter(start) &&
          e !== event
        );
      });

      let width = 'calc(100% - 120px)';
      let left = '90px';

      // if (overlappingEvents.length > 0) {
      //   width = `calc((100% - 120px) / ${overlappingEvents.length + 1})`;
      //   left = `${90 + overlappingEvents.findIndex(e => e === event) * parseFloat(width)}px`;
      // }

      return (
        <div
          key={index}
          className="absolute bg-blue-500 text-white rounded-md p-2 pt-0 text-sm shadow-md border border-white-300 overflow-hidden group"
          style={{
            top: `${top}px`,
            height: `${duration}px`,
            width: width,
            left: overlappingEvents.length > 0 && false ? left : '90px',
          }}
          onClick={(e) => {
            e.stopPropagation();
            openEventSummary(event);
          }}
        >
          <strong>{event.title}</strong>
          <br />
          <span className="text-gray-200 text-xs">
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
    <div className="relative w-full h-screen border border-gray-300 overflow-y-auto">
      {renderHours()}
      {renderEvents()}
      {renderCurrentTime()}
    </div>
  );
};

export default App;
