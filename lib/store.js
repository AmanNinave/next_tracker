import dayjs from "dayjs";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { getMonth } from "./getTime";

export const useViewStore = create()(
  devtools(
    persist(
      (set) => ({
        selectedView: "day",
        setView: (value) => {
          set({ selectedView: value });
        },
      }),
      { name: "calendar_view", skipHydration: true },
    ),
  ),
);

export const useDateStore = create()(
  devtools(
    persist(
      (set) => ({
        userSelectedDate: dayjs(),
        twoDMonthArray: getMonth(),
        selectedMonthIndex: dayjs().month(),
        setDate: (value) => {
          set({ userSelectedDate: value });
        },
        setMonth: (index) => {
          set({ twoDMonthArray: getMonth(index), selectedMonthIndex: index });
        },
      }),
      { name: "date_data", skipHydration: true },
    ),
  ),
);

export const useEventStore = create((set) => ({
  events: [],
  tasks: [],
  taskLogs: [],
  taskSchedules: [],
  viewMode: "both",

  isPopoverOpen: false,
  isEventSummaryOpen: false,
  selectedEvent: null,

  setEvents: (events) => set({ events }),
  setTasks: (tasks) => set({ tasks }),
  setTaskLogs: (taskLogs) => set({ taskLogs }),
  setTaskSchedules: (taskSchedules) => set({ taskSchedules }),
  setViewMode: (viewMode) => set({ viewMode }),

  openPopover: () => set({ isPopoverOpen: true }),
  closePopover: () => set({ isPopoverOpen: false }),
  openEventSummary: (event) =>
    set({ isEventSummaryOpen: true, selectedEvent: event }),
  closeEventSummary: () =>
    set({ isEventSummaryOpen: false, selectedEvent: null }),

  updateTasksData: (key , data) => {
    
  }
}));

export const useToggleSideBarStore = create()(
  (set, get) => ({
    isSideBarOpen: true,
    setSideBarOpen: () => {
      set({ isSideBarOpen: !get().isSideBarOpen });
    },
  }),
);
