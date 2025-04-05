"use client";
import { getTasksData } from "@/app/actions/taskActions";
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
    <>
    </>
  );
}
