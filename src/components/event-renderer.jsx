"use client"

import { useEventStore } from "./../../lib/store";
import dayjs from "dayjs";
import React from "react";

export function EventRenderer({ date, view, taskSchedules }) {
  const { openEventSummary } = useEventStore();
  
  const filteredEvents = taskSchedules.filter((event) => {
    if (view === "month") {
      return event.date.format("DD-MM-YY") === date.format("DD-MM-YY");
    } else if (view === "week" || view === "day") {
      return dayjs(event.date).format("DD-MM-YY HH") === date.format("DD-MM-YY HH");
    }
    return false;
  });

  return (
    <>
      {filteredEvents.map((event) => (
        <div
          key={event.id}
          onClick={(e) => {
            e.stopPropagation();
            openEventSummary(event);
          }}
          className="line-clamp-1 w-[90%] cursor-pointer rounded-sm bg-green-700 p-1 text-sm text-white"
        >
          {event.title}
        </div>
      ))}
    </>
  );
}
