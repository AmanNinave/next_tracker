"use client";
import { getTaskSchedulesData } from "@/app/actions/task-actions";
import Header from "@/components/header/Header";
import MainView from "@/components/main-view";
import { useState, useEffect } from "react";

export default function Home() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTaskSchedules = async () => {
      const tasks = await getTaskSchedulesData();
      console.log("Tasks:", tasks);
      setTasks(tasks);
    };

    fetchTaskSchedules();
  }, []);

  return (
    <div className="">
      <Header />
      <MainView tasksData={tasks} />
    </div>
  );
}
