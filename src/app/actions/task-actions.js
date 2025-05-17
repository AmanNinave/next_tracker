
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { redirect } from "next/navigation";

import { createNewScheduleEntry, createNewTask, fetchTaskLogsDataByDuration, fetchTasks, fetchTaskSchedules, fetchTaskSchedulesDataByDuration, updateTaskApi } from '@/app/api/tasks/route';

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
    const data = await fetchTaskSchedulesDataByDuration(startDate);

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

export const createTask = async (formData) => {
  try {
    const title = formData.get("title");
    const description = formData.get("description");

    const category = formData.get("category");
    const sub_category = formData.get("subCategory");

    const status = formData.get("status");

    const payload = {
      title,
      description,
      category,
      sub_category,
      status
    }

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