
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { redirect } from "next/navigation";

import { createNewScheduleEntry, createNewTask, fetchTasks, fetchTaskSchedules } from '@/app/api/tasks/route';

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

