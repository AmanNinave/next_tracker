
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { redirect } from "next/navigation";
import { createNewScheduleEntry, createNewTask, fetchEventsDataByDuration, fetchTaskLogsDataByDuration, fetchTasks, fetchTaskSchedules, fetchTaskSchedulesDataByDuration, updateTaskApi } from '@/app/api/tasks/route';
import { useEventStore } from "../../../lib/store";

dayjs.extend(utc);
dayjs.extend(timezone);

export const getTasks = async () => {
  try {
    return await fetchTasks();
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    if (error.status === 401 || error.redirect) {
      redirect("/login");
    }
    return
  }
}

export const getTaskSchedulesData = async () => {
  try {
    const data = await fetchTaskSchedules();

    return data.map((task) => ({
      ...task,
      date: dayjs.utc(task.start_time).tz("Asia/Kolkata").format(),
      start_time: dayjs.utc(task.start_time).tz("Asia/Kolkata").format(),
      end_time: dayjs.utc(task.end_time).tz("Asia/Kolkata").format(),
    }));
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    if (error.status === 401 || error.redirect) {
      redirect("/login");
    }
    return
  }
}

export const getTaskSchedulesDataByDuration = async () => {
  try {
    const startDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    const endDate = dayjs().add(1, "day").format("YYYY-MM-DD");
    const skip = 0;
    const limit = 100;
    const data = await fetchTaskSchedulesDataByDuration(startDate, endDate, skip, limit);

    return data.map((task) => ({
      ...task,
      date: dayjs.utc(task.start_time).tz("Asia/Kolkata").format(),
      start_time: dayjs.utc(task.start_time).tz("Asia/Kolkata").format(),
      end_time: dayjs.utc(task.end_time).tz("Asia/Kolkata").format(),
    }));
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    if (error.status === 401 || error.redirect) {
      redirect("/login");
    }
    return
  }
}

export const getTaskLogsDataByDuration = async () => {
  try {
    const startDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    // const endDate = dayjs().format("YYYY-MM-DD");
    // const skip = 0;
    // const limit = 100;
    const data = await fetchTaskLogsDataByDuration(startDate);

    return data.map((task) => ({
      ...task,
      date: dayjs.utc(task.start_time).tz("Asia/Kolkata").format(),
      start_time: dayjs.utc(task.start_time).tz("Asia/Kolkata").format(),
      end_time: dayjs.utc(task.end_time).tz("Asia/Kolkata").format(),
    }));
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    if (error.status === 401 || error.redirect) {
      redirect("/login");
    }
    return
  }
}

export const getEventDataByDuration = async (startDate = null, endDate = null, skip = 0, limit = 100) => {
    try {
    const startDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    const endDate = dayjs().add(1, "day").format("YYYY-MM-DD");
    const skip = 0;
    const limit = 100;
    
    
    const data = await fetchEventsDataByDuration(startDate, endDate, skip, limit);

    // Transform dates to IST timezone and format consistently
    return data.map((event) => ({
      ...event,
      date: dayjs.utc(event.start_time).tz("Asia/Kolkata").format(),
      start_time: dayjs.utc(event.start_time).tz("Asia/Kolkata").format(),
      end_time: dayjs.utc(event.end_time).tz("Asia/Kolkata").format(),
    }));
  } catch (error) {
    console.error("Error fetching events from the database:", error);
    if (error.status === 401 || error.redirect) {
      redirect("/login");
    }
    return [];
  }
}

export const createTask = async (payload) => {
  try {
    return createNewTask(payload)
  } catch (error) {
    console.error("Error creating task in the database:", error);
    if (error.status === 401 || error.redirect) {
      redirect("/login");
    }
    return [];
  }
}

export const updateTask = async (task_id, taskData) => {
  try {
    // For direct object updates (not FormData)
    if (typeof taskData !== 'object' || taskData instanceof FormData) {
      throw new Error("Invalid task data format");
    }
    
    const payload = {
      title: taskData.title,
      description: taskData.description,
      category: taskData.category,
      sub_category: taskData.sub_category,
      status: taskData.status
    };

    if(taskData.indicators){
      payload.indicators = taskData.indicators;
    }
    if(taskData.settings){
      payload.settings = taskData.settings;
    }
    
    // Call the updateTask API function (you need to implement this in your API route)
    return await updateTaskApi(task_id, payload);
  } catch (error) {
    console.error("Error updating task in the database:", error);
    if (error.status === 401 || error.redirect) {
      redirect("/login");
    }
    throw error; // Re-throw to handle in the component
  }
}