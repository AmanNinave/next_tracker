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
import { FiClock, FiMessageCircle } from "react-icons/fi";
import { createNewLogEntry, endEvent, updateLogEntry } from "@/app/api/tasks/route";
import { useEventStore } from "../../lib/store";

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
  const {events, setEvents, taskLogs, setTaskLogs, taskSchedules, setTaskSchedules } = useEventStore();
  console.log("taskLogs", task);
  let lastLogData = task?.task_logs?.[task?.task_logs?.length - 1] || null;
  // Add states for remarks
  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [remarks, setRemarks] = useState(lastLogData && !lastLogData.end_time  ? lastLogData.remarks : "");
  
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

  const resetStates = () => {
    setError(null);
    setSuccess(null);
  };
  
  // Handle starting a task
  const handleStartTask = () => {
    resetStates();
    
    startTransition(async () => {
      try {
        // Check if any task is already running
        const runningTaskLog = taskLogs.find(log => {
          // Check for null or undefined
          if (log.end_time === null || log.end_time === undefined) return true;
          
          // Check for invalid date string or object
          if (log.end_time === "" || log.end_time === "Invalid Date") return true;
          
          // Use dayjs to validate dates
          const date = dayjs(log.end_time);
          return !date.isValid();
        });
        
        if (runningTaskLog) {
          // // Below code is commented out because it is taking starttime and end time from last log which is mismatching with schedule time
          // // Show a confirmation dialog
          // if (confirm("You have a running task. Do you want to end it before starting this one?")) {
          //   // End the running task first
          //   const taskSchedule = taskSchedules.find(schedule => 
          //     schedule.task_logs.some(log => log.id === runningTaskLog.id)
          //   );
            
          //   if (taskSchedule) {
          //     // Create a temporary task object with the running log for endTask
          //     const runningTask = {
          //       id: taskSchedule.id,
          //       task: { id: taskSchedule.task.id },
          //       task_logs: taskSchedule.task_logs.filter(log => log.id === runningTaskLog.id)
          //     };
              
          //     // Call endTask for the running task
          //     // await endRunningTask(runningTask);
          //     // await handleEndTask(runningTask);
          //   } else {
          //     // User chose not to end running task
          //     setError("Please end the running task first.");
          //     return;
          //   }
          // } else {
            // User chose not to end running task
            setError("Please end the running task first.");
            return;
          // }
        }
        
        // Create new log entry for current task
        const result = await createNewLogEntry({
          task_schedule_id: task.id,
          task_id: task.task.id,
          start_time: new Date(),
          end_time: null,
          remarks: remarks.trim(),
        });
        
        result.start_time = dayjs();
        
        if (result.id) {
          // Update the task schedule with the new log entry
          const updatedTaskSchedules = taskSchedules.map((schedule) => {
            if (schedule.id === task.id) {
              return { ...schedule, task_logs: [...schedule.task_logs, result] };
            }
            return schedule;
          });
          setTaskSchedules(updatedTaskSchedules);

          // Add to task logs
          setTaskLogs([...taskLogs, result]);
          setSuccess("Task started successfully.");
          onClose();
        }
        
        if ("error" in result) {
          setError(result.error);
        }
      } catch (error) {
        console.error("Error starting task:", error);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  // New helper function to end a running task
  const endRunningTask = async (taskObj, logData) => {
    try {
      // Update log entry
      const result = await updateLogEntry(logData.id, {
        start_time: logData.start_time,
        end_time: new Date(),
        remarks: logData.remarks || "Automatically ended when starting new task",
      });
      
      if (result.id) {
        // Update task schedules
        const updatedTaskSchedules = taskSchedules.map((schedule) => {
          if (schedule.id === taskObj.id) {
            const updatedLogs = schedule.task_logs.map((log) => {
              if (log.id === result.id) {
                return { ...log, end_time: dayjs(), remarks: log.remarks || "Automatically ended when starting new task" };
              }
              return log;
            });
            return { ...schedule, task_logs: updatedLogs };
          }
          return schedule;
        });
        setTaskSchedules(updatedTaskSchedules);

        // Update task logs
        const updatedLogs = taskLogs.map((log) => {
          if (log.id === result.id) {
            return { ...log, end_time: dayjs(), remarks: log.remarks || "Automatically ended when starting new task" };
          }
          return log;
        });
        setTaskLogs(updatedLogs);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error ending running task:", error);
      return false;
    }
  };
  
  // Handle ending a task
  const handleEndTask = async (taskSchedule) => {
    resetStates();
    
    startTransition(async () => {
      try {
        const lastLogData = taskSchedule.task_logs[taskSchedule.task_logs.length - 1];
        
        // Validate task can be ended
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
        
        // Update log entry
        const result = await updateLogEntry(lastLogData.id, {
          start_time: lastLogData.start_time,                     // This is in utc
          end_time: new Date(),                                   // This is in utc
          remarks: remarks.trim(),
        });
        
        if (result.id) {
          // Update task schedules
          const updatedTaskSchedules = taskSchedules.map((schedule) => {
            if (schedule.id === taskSchedule.id) {
              const updatedLogs = schedule.task_logs.map((log) => {
                if (log.id === result.id) {
                  return { ...log, end_time: dayjs(), remarks: remarks.trim() };
                }
                return log;
              });
              return { ...schedule, task_logs: updatedLogs };
            }
            return schedule;
          });
          setTaskSchedules(updatedTaskSchedules);

          // Update task logs
          const updatedLogs = taskLogs.map((log) => {
            if (log.id === result.id) {
              return { ...log, end_time: dayjs(), remarks: remarks.trim() };
            }
            return log;
          });
          setTaskLogs(updatedLogs);
          setSuccess("Task ended successfully."); // Fixed the success message
          onClose();
        }
        
        if ("error" in result) {
          setError(result.error);
        }
      } catch (error) {
        console.error("Error ending task:", error);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };
  
  // Handle save log (router function)
  const handleSaveLog = (shouldStart) => {
    if (shouldStart) {
      handleStartTask();
    } else {
      handleEndTask(task);
    }
  };

  // Handle ending an event
  const handleEndEvent = async () => {
    console.log("handleEndEvent", task);
    resetStates();
    startTransition(async () => {
      try {

        if (task.status === "completed") {
          setError("You have already ended this event.");
          return;
        }

        const result = await endEvent(task.id, {
          ...task,
          start_time: dayjs(task.start_time).tz("Asia/Kolkata").utc().format(),
          end_time: dayjs().utc().format(),
          indicators: { ...task.indicators, remarks: remarks.trim() },
        });

        if (result.id) {
          const updatedEvents = events.map((event) => {
            if (event.id === task.id) {
              return { ...event, end_time: dayjs().tz("Asia/Kolkata").format(), indicators: { ...event.indicators, remarks: remarks.trim() } };
            }
            return event;
          });
          setEvents(updatedEvents);
          setSuccess("Event ended successfully.");
          onClose();
        }

      } catch (error) {
        console.error("Error ending event:", error);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  if (!isOpen) return null;
  const shouldShowStartButton = task.type === "event" ? false : task.task_logs?.length == 0 || task.task_logs?.[task.task_logs?.length - 1]?.end_time;
  const shouldDisableButton = task.type === "event" && (task.end_time !== null && task.end_time !== "Invalid Date");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-200" onClick={onClose}>
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
            <h2 className="text-lg font-semibold">{task?.title || task.task?.title || "Task Title"}</h2>
            <p className="text-sm text-gray-600">{task?.description || task.task?.description || "Task Description"}</p>
          </div>
          
          {/* Task metadata */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <p className="text-xs text-gray-500">Category</p>
              <p className="text-sm">{task.category || task.task?.category || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Subcategory</p>
              <p className="text-sm">{task.sub_category || task.task?.sub_category || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(task.task?.status || "Pending")}`}>
                {task.task?.status || "Pending"}
              </span>
            </div>
          </div>
          
          {/* Scheduled time */}
          {
            task.type !== "event" && (
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
            )
          }
          
          {/* Task logs */}
          {
            task.type !== "event" && (
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
            )
          }
          
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

        {/* Remarks input section */}
        {showRemarksInput && (
          <div className="mx-4 mb-2 animate-fadeIn">
            <div className="flex items-center mb-1">
              <FiMessageCircle className="text-gray-500 mr-2" />
              <p className="text-sm font-medium text-gray-700">Add Remarks</p>
            </div>
            <Textarea
              id="task-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={`Add notes about ${shouldShowStartButton ? 'starting' : 'completing'} this task...`}
              className="w-full resize-none border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={3}
            />
          </div>
        )}

        <div className="flex justify-center gap-1 p-3 bg-gray-50 rounded-b-lg">
          <Button onClick={() => { !showRemarksInput ? setShowRemarksInput(true) : task.type == 'event' ? handleEndEvent() : handleSaveLog(shouldShowStartButton)}}
            className="w-full bg-blue-500 text-white hover:bg-blue-600"
            disabled={isPending || shouldDisableButton}
          >
            {showRemarksInput ? "Confirm": shouldShowStartButton ? "Start Task" : "End Task"}
          </Button>
        </div>
      </div>
    </div>
  );
}