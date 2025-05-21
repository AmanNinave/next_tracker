"use client";
import { getEventDataByDuration, getTaskLogsDataByDuration, getTasks, getTaskSchedulesData, getTaskSchedulesDataByDuration } from "@/app/actions/task-actions";
import Header from "@/components/header/Header";
import MainView from "@/components/main-view";
import { useState, useEffect } from "react";
import { useEventStore } from "../../lib/store";

export default function Home() {
  const {events, setEvents, tasks, setTasks, taskLogs, setTaskLogs, taskSchedules, setTaskSchedules} = useEventStore();

  useEffect(() => {
    const fetchTaskData = async () => {

      // Run all API calls concurrently with Promise.all
      const [eventsData, logsData, schedulesData, tasksData] = await Promise.all([
        getEventDataByDuration(),
        getTaskLogsDataByDuration(),
        getTaskSchedulesDataByDuration(),
        getTasks()
      ]);

      setEvents(eventsData);
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
