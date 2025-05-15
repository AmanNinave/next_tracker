"use client";

import React, { useRef, useEffect, useState, useTransition, useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Button } from "@/components/ui/button";
import { IoCloseSharp } from "react-icons/io5";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {  } from "@/app/actions/task-actions";
import AddTime from "./add-time";
import { categories, subcategories, breakCategories, statuses } from "@/utils/constants";
import { FiClock } from "react-icons/fi";
import { createNewLogEntry, updateLogEntry } from "@/app/api/tasks/route";

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Helper function to convert UTC to IST
const toIndianTime = (date) => {
  if (!date) return null;
  return dayjs(date).tz("Asia/Kolkata");
};

function getStatusColor(status) {
  switch (status) {
    case "Pending":
      return "bg-blue-200 text-blue-700";
    case "In Progress":
      return "bg-yellow-200 text-yellow-700";
    case "Completed":
      return "bg-green-200 text-green-700";
    default:
      return "";
  }
}

export function EventSummaryPopover({ isOpen, onClose, task }) {
  const popoverRef = useRef(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isPending, startTransition] = useTransition();
  console.log("task", task);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);


  const handleSaveLog = (shouldStart) => {
    setError(null);
    setSuccess(null);
    debugger;
    // if (shouldStart) {
    //   return;
    // }
    startTransition(async () => {
      try {
        let result;
        if (shouldStart) {
          result = await createNewLogEntry({
            task_schedule_id: task.id,
            start_time: new Date(),
            end_time: null,
            remarks: '',
          });
        }else {
          let lastLogData = task.task_logs[task.task_logs.length - 1];
          if (lastLogData.end_time) {
            setError("You have already ended this task.");
            return;
          }
          if (!lastLogData.start_time) {
            setError("You have not started this task yet.");
            return;
          }
          if (lastLogData.start_time > new Date()) {
            setError("You cannot end a task that has not started yet.");
            return;
          }
          if (lastLogData.start_time > lastLogData.end_time) {
            setError("End time cannot be before start time.");
            return;
          }
          result = await updateLogEntry(task.task_logs[task.task_logs.length - 1].id ,{
            start_time: lastLogData.start_time,
            end_time: new Date(),
            remarks: lastLogData.remarks,
          });
        }
        
        if ("error" in result) {
          setError(result.error);
        } else if (result.success) {
          setSuccess(result.success);
          onClose();
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };


  if (!isOpen) return null;
  const shouldShowStartButton = task.task_logs.length == 0 || task.task_logs[task.task_logs.length - 1]?.end_time;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div
        ref={popoverRef}
        className="w-full max-w-md rounded-lg bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between rounded-md bg-slate-100 p-1">
          <div className="flex items-center space-x-3 text-sm">
            <FiClock className="size-5 text-gray-600 ml-1" />
            <p>{toIndianTime(task.start_time).format("dddd, MMMM D YYYY")} (IST)</p>
          </div>
          <Button variant="ghost" size="icon" type="button" onClick={onClose}>
            <IoCloseSharp className="h-4 w-4" />
          </Button>
        </div>

        {/* Task details section */}
        <div className="p-4">
          {/* Task header info */}
          <div className="mb-3">
            <h2 className="text-lg font-semibold">{task.task?.title || "Task Title"}</h2>
            <p className="text-sm text-gray-600">{task.task?.description || "Task Description"}</p>
          </div>
          
          {/* Task metadata */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <p className="text-xs text-gray-500">Category</p>
              <p className="text-sm">{task.task?.category || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Subcategory</p>
              <p className="text-sm">{task.task?.sub_category || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(task.task?.status || "Pending")}`}>
                {task.task?.status || "Pending"}
              </span>
            </div>
          </div>
          
          {/* Scheduled time */}
          <div className="mb-3 p-2 bg-gray-50 rounded-md">
            <p className="text-xs font-medium text-gray-700 mb-1">Scheduled Time</p>
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-xs text-gray-500">Start</p>
                <p>{toIndianTime(task.start_time).format("hh:mm A")} IST</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">End</p>
                <p>{toIndianTime(task.end_time).format("hh:mm A")} IST</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p>{dayjs(task.end_time).diff(dayjs(task.start_time), 'minute')} min</p>
              </div>
            </div>
          </div>
          
          {/* Task logs */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-700 mb-1">Activity Logs</p>
            {task.task_logs && task.task_logs.length > 0 ? (
              task.task_logs.map((log, index) => (
                <div key={log.id || index} className="border p-2 rounded-md mb-2 text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Start: {toIndianTime(log.start_time).format("hh:mm A")} IST</span>
                    <span>End: {log.end_time ? toIndianTime(log.end_time).format("hh:mm A") + " IST" : "In progress"}</span>
                  </div>
                  {log.end_time && (
                    <div className="text-right text-xs text-gray-500">
                      Duration: {dayjs(log.end_time).diff(dayjs(log.start_time), 'minute')} min
                    </div>
                  )}
                  {log.remarks && <p className="text-xs mt-1 text-gray-700">Remarks: {log.remarks}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No activity logs yet</p>
            )}
          </div>
          
          {/* Error and success messages */}
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm mb-3">
              {error}
            </div>
          )}
          {success && (
            <div className="p-2 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm mb-3">
              {success}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-1 p-3 bg-gray-50 rounded-b-lg">
          <Button onClick={() => handleSaveLog(shouldShowStartButton)}>{shouldShowStartButton ? "Start" : "End"}</Button>
        </div>
      </div>
    </div>
  );
}