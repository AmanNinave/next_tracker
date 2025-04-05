"use client";
import { getTasksData } from "@/app/actions/task-actions";
import Header from "@/components/header/Header";
import MainView from "@/components/main-view";
import { useState, useEffect } from "react";

export default function Home() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const tasks = await getTasksData();
      console.log("Tasks:", tasks);
      setTasks(tasks);
    };

    fetchTasks();
  }, []);

  return (
    <div className="">
      <Header />
      <MainView tasksData={tasks} />
    </div>
  );
}
