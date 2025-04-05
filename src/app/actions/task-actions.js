
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { fetchTasks } from '@/app/api/tasks/route';

dayjs.extend(utc);
dayjs.extend(timezone);


export const getTasksData = async () => {
  try {
    const data = await fetchTasks();

    return data.map((task) => ({
      ...task,
      date: dayjs.utc(task.planned_time).tz("Asia/Kolkata").format(),
      planned_time: dayjs.utc(task.planned_time).tz("Asia/Kolkata").format(),
    }));
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    return [];
  }
};