"use client";
import { getTasks, getTaskSchedulesData } from "@/app/actions/task-actions";
import Header from "@/components/header/Header";
import MainView from "@/components/main-view";
import { useState, useEffect } from "react";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [taskSchedules, setTaskSchedules] = useState([]);

  useEffect(() => {
    const fetchTaskData = async () => {
      const taskSchedules = await getTaskSchedulesData();
      const tasksData = await getTasks();
      setTasks(tasksData);
      setTaskSchedules(taskSchedules);
    };

    fetchTaskData();
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Header  />
      <MainView tasksData={tasks} taskSchedulesData={taskSchedules} />
    </div>
  );
}
