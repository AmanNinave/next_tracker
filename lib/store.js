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

export const useEventStore = create((set, get) => ({
  events: [],
  tasks: [],
  taskLogs: [],
  taskSchedules: [],
  viewMode: "both",
  
  // Loading states
  isLoading: false,
  error: null,

  isPopoverOpen: false,
  isEventSummaryOpen: false,
  selectedEvent: null,

  // Basic setters
  setEvents: (events) => set({ events }),
  setTasks: (tasks) => set({ tasks }),
  setTaskLogs: (taskLogs) => set({ taskLogs }),
  setTaskSchedules: (taskSchedules) => set({ taskSchedules }),
  setViewMode: (viewMode) => set({ viewMode }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Popover and modal controls
  openPopover: () => set({ isPopoverOpen: true }),
  closePopover: () => set({ isPopoverOpen: false }),
  openEventSummary: (event) =>
    set({ isEventSummaryOpen: true, selectedEvent: event }),
  closeEventSummary: () =>
    set({ isEventSummaryOpen: false, selectedEvent: null }),

  // Data fetching methods
  fetchTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const tasks = await response.json();
      set({ tasks, isLoading: false });
      return tasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchEvents: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      const events = await response.json();
      set({ events, isLoading: false });
      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchTaskLogs: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/task-logs');
      if (!response.ok) throw new Error('Failed to fetch task logs');
      const taskLogs = await response.json();
      set({ taskLogs, isLoading: false });
      return taskLogs;
    } catch (error) {
      console.error('Error fetching task logs:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchTaskSchedules: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/task-schedules');
      if (!response.ok) throw new Error('Failed to fetch task schedules');
      const taskSchedules = await response.json();
      set({ taskSchedules, isLoading: false });
      return taskSchedules;
    } catch (error) {
      console.error('Error fetching task schedules:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Refresh methods (alias for fetch methods)
  refreshTasks: async () => {
    const { fetchTasks } = get();
    return await fetchTasks();
  },

  refreshEvents: async () => {
    const { fetchEvents } = get();
    return await fetchEvents();
  },

  refreshTaskLogs: async () => {
    const { fetchTaskLogs } = get();
    return await fetchTaskLogs();
  },

  refreshTaskSchedules: async () => {
    const { fetchTaskSchedules } = get();
    return await fetchTaskSchedules();
  },

  // Refresh all data
  refreshAllData: async () => {
    const { fetchTasks, fetchEvents, fetchTaskLogs, fetchTaskSchedules } = get();
    try {
      set({ isLoading: true, error: null });
      await Promise.all([
        fetchTasks(),
        fetchEvents(),
        fetchTaskLogs(),
        fetchTaskSchedules()
      ]);
      set({ isLoading: false });
    } catch (error) {
      console.error('Error refreshing all data:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update specific task data
  updateTasksData: (taskId, scheduleId, logData, isNewLog = false) => {
    const { tasks } = get();
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const updatedSchedules = task.task_schedules?.map(schedule => {
          if (schedule.id === scheduleId) {
            let updatedLogs;
            
            if (isNewLog) {
              // Add new log entry
              updatedLogs = [...(schedule.task_logs || []), logData];
            } else {
              // Update existing log entry
              updatedLogs = schedule.task_logs?.map(log => 
                log.id === logData.id ? { ...log, ...logData } : log
              ) || [];
            }
            
            return {
              ...schedule,
              task_logs: updatedLogs
            };
          }
          return schedule;
        }) || [];
        
        return {
          ...task,
          task_schedules: updatedSchedules
        };
      }
      return task;
    });
    
    set({ tasks: updatedTasks });
  },

  // Update specific schedule data
  updateScheduleData: (scheduleId, logData, isNewLog = false) => {
    const { taskSchedules } = get();
    const updatedSchedules = taskSchedules.map(schedule => {
      if (schedule.id === scheduleId) {
        let updatedLogs;
        
        if (isNewLog) {
          // Add new log entry
          updatedLogs = [...(schedule.task_logs || []), logData];
        } else {
          // Update existing log entry
          updatedLogs = schedule.task_logs?.map(log => 
            log.id === logData.id ? { ...log, ...logData } : log
          ) || [];
        }
        
        return {
          ...schedule,
          task_logs: updatedLogs
        };
      }
      return schedule;
    });
    
    set({ taskSchedules: updatedSchedules });
  },

  // Update task logs array directly
  updateTaskLogs: (logData, isNewLog = false) => {
    const { taskLogs } = get();
    let updatedLogs;
    
    if (isNewLog) {
      // Add new log entry
      updatedLogs = [...taskLogs, logData];
    } else {
      // Update existing log entry
      updatedLogs = taskLogs.map(log => 
        log.id === logData.id ? { ...log, ...logData } : log
      );
    }
    
    set({ taskLogs: updatedLogs });
  },

  // Combined update method for all related data
  updateAllRelatedData: (taskId, scheduleId, logData, isNewLog = false) => {
    const { updateTasksData, updateScheduleData, updateTaskLogs } = get();
    
    // Update all related data structures
    updateTasksData(taskId, scheduleId, logData, isNewLog);
    updateScheduleData(scheduleId, logData, isNewLog);
    updateTaskLogs(logData, isNewLog);
  },

  // Clear all data
  clearAllData: () => {
    set({
      events: [],
      tasks: [],
      taskLogs: [],
      taskSchedules: [],
      error: null,
      isLoading: false
    });
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