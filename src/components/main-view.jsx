'use client';

import {
  useDateStore,
  useEventStore,
  useViewStore,
} from "../../lib/store";

import MonthView from './month-view';
import SideBar from './sidebar/SideBar';
import WeekView from './week-view';
// import DayView from "./day-view";
import EventPopover from './event-popover';
import { EventSummaryPopover } from './event-summary-popover';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import DayView from './day-view-test';

export default function MainView() {
  const { selectedView } = useViewStore();
  
  const {
    isPopoverOpen,
    closePopover,
    isEventSummaryOpen,
    closeEventSummary,
    selectedEvent,
  } = useEventStore();

  const { userSelectedDate } = useDateStore();

  return (
    <div className="flex mt-[58px] h-[calc(100vh-58px)]">
      {/* SideBar */}
      <SideBar />

      <div className="w-full flex-1">
        {selectedView === 'month' && <MonthView />}
        {selectedView === 'week' && <WeekView />}
        {selectedView === 'day' && <DayView />}
      </div>

      {isPopoverOpen && (
        <EventPopover
          isOpen={isPopoverOpen}
          onClose={closePopover}
          date={userSelectedDate.format('YYYY-MM-DD')}
        />
      )}

      {isEventSummaryOpen && selectedEvent && (
        <EventSummaryPopover
          isOpen={isEventSummaryOpen}
          onClose={closeEventSummary}
          task={selectedEvent}
        />
      )}
    </div>
  );
}
