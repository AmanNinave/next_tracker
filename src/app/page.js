"use client";
import { getTaskLogsDataByDuration, getTasks, getTaskSchedulesData, getTaskSchedulesDataByDuration } from "@/app/actions/task-actions";
import Header from "@/components/header/Header";
import MainView from "@/components/main-view";
import { useState, useEffect } from "react";
import { useEventStore } from "../../lib/store";

export default function Home() {
  const {tasks, setTasks, taskLogs, setTaskLogs, taskSchedules, setTaskSchedules} = useEventStore();

  useEffect(() => {
    const fetchTaskData = async () => {

      // Run all API calls concurrently with Promise.all
      const [logsData, schedulesData, tasksData] = await Promise.all([
        getTaskLogsDataByDuration(),
        getTaskSchedulesDataByDuration(),
        getTasks()
      ]);

      setTaskLogs(logsData);
      setTaskSchedules(schedulesData);
      setTasks(tasksData);
    };

    fetchTaskData();
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Header  />
      <MainView  />
    </div>
  );
}
