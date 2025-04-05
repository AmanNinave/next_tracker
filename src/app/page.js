import { fetchTasks } from '@/utils/api'

const getTasksData = async () => {
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

export default async function Home() {
  // const tasks = await getTasksData();
  // console.log(tasks);
  return (
    <>
    </>
  );
}
