"use client";

import React, { startTransition, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DateTimePickerForm from "../time-picker/date-time-picker-form";
import { Calendar, Clock, Clipboard, ArrowRight } from "lucide-react"; // Import icons
import { Badge } from "@/components/ui/badge"; // Assuming you have a Badge component from your UI library
import { statuses, categories_and_subcategories } from "@/utils/constants";
import { updateTask } from "@/app/actions/task-actions";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { createNewLogEntry, updateLogEntry } from "@/app/api/tasks/route";
import { useEventStore } from "../../../lib/store";



// Configure dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

// Helper function to convert UTC to IST
const toIndianTime = (date) => {
  if (!date) return null;
  return dayjs.utc(date).tz("Asia/Kolkata");
};

function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "in progress":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

const TaskList = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(statuses[5]); // Default to "recurring"
  const [currentCategory, setCurrentCategory] = useState("all");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const { tasks , setTasks} = useEventStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    sub_category: "",
    status: ""
  });

  // state for remarks input
  const [showRemarksInput, setShowRemarksInput] = useState(null); // Store task ID when showing remarks
  const [remarks, setRemarks] = useState("");

  const [expandedSchedules, setExpandedSchedules] = useState(new Set());
  const [expandedLogs, setExpandedLogs] = useState(new Set());

  // Function to toggle individual schedule
  const toggleSchedule = (scheduleId) => {
    const newExpanded = new Set(expandedSchedules);
    if (newExpanded.has(scheduleId)) {
      newExpanded.delete(scheduleId);
    } else {
      newExpanded.add(scheduleId);
    }
    setExpandedSchedules(newExpanded);
  };

  // Function to toggle logs within a schedule
  const toggleLogs = (scheduleId) => {
    const newExpandedLogs = new Set(expandedLogs);
    if (newExpandedLogs.has(scheduleId)) {
      newExpandedLogs.delete(scheduleId);
    } else {
      newExpandedLogs.add(scheduleId);
    }
    setExpandedLogs(newExpandedLogs);
  };

  // Initialize form data when task is selected
  useEffect(() => {
    if (selectedTask) {
      setEditForm({
        title: selectedTask.title || "",
        description: selectedTask.description || "",
        category: selectedTask.category || "",
        sub_category: selectedTask.sub_category || "",
        status: selectedTask.status || ""
      });
    }
  }, [selectedTask]);


  const handleTaskUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      
      const response = await updateTask(selectedTask.id, editForm);
      
      // If successful, update the local task data
      setSelectedTask({...selectedTask, ...editForm});
      let updatedTasks = tasks.map(task =>
        task.id === selectedTask.id ? {...task, ...editForm} : task
      );
      setTasks(updatedTasks);
      
      // Exit editing mode
      setIsEditing(false);
      // Show success message or refresh tasks
      // toast.success("Task updated successfully");
    } catch (error) {
      console.error("Failed to update task:", error);
      // Show error message
      // toast.error("Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get all available categories from the constants
  const allCategories = ["all", ...Object.keys(categories_and_subcategories)];

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const closeDialog = () => {
    setSelectedTask(null);
    setIsScheduleEnabled(false);
  };

  // Format datetime in Indian timezone
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    
    // First parse as UTC, then convert to Indian timezone
    return dayjs.utc(dateString)
      .tz("Asia/Kolkata")
      .format("D MMM YYYY, h:mm A");
  };

    // Calculate duration in minutes
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    return Math.round(
      (dayjs(endTime).valueOf() - dayjs(startTime).valueOf()) / 60000
    );
  };

  // log related functions
  const handleSaveLog = (shouldStart , task_schedule_id, task_id, logDetails, remarksText = "") => {
    setError(null);
    setSuccess(null);
    setIsPending(true);
    startTransition(async () => {
      try {
        let result;
        if (shouldStart) {
          result = await createNewLogEntry({
            task_schedule_id: task_schedule_id,
            task_id: task_id,
            start_time: new Date(),
            end_time: null,
            remarks: remarksText.trim(),
          });
        }else {
          let lastLogData = logDetails;
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
          result = await updateLogEntry(lastLogData.id ,{
            start_time: lastLogData.start_time,
            end_time: new Date(),
            remarks: remarksText.trim() || lastLogData.remarks,
          });
        }
        
        setIsPending(false);
        toggleRemarksInput(); // Hide remarks input after submission
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

  const updateAllRelatedData = async (taskId, scheduleId, newLogData, wasStartAction) => {
    try {
      // Get store methods
      const { 
        fetchTasks, 
        refreshTaskLogs, 
        refreshTaskSchedules, 
        refreshEvents,
        taskSchedules,
        setTaskSchedules 
      } = useEventStore.getState();
      
      // Update tasks data locally first for immediate UI feedback
      updateTasksDataLocally(taskId, scheduleId, newLogData, wasStartAction);
      
      // Update task schedules data locally
      updateSchedulesDataLocally(scheduleId, newLogData, wasStartAction);
      
      // Then refresh all data from server to ensure consistency
      await Promise.all([
        fetchTasks?.(),
        refreshTaskLogs?.(),
        refreshTaskSchedules?.(),
        refreshEvents?.()
      ]);
      
      console.log("All data updated successfully");
    } catch (error) {
      console.error("Error updating related data:", error);
      setError("Task updated but display refresh failed. Please reload the page.");
    }
  };

  // Update schedules data locally in the store
  const updateSchedulesDataLocally = (scheduleId, newLogData, wasStartAction) => {
    const { taskSchedules, setTaskSchedules } = useEventStore.getState();
    
    const updatedSchedules = taskSchedules.map(schedule => {
      if (schedule.id === scheduleId) {
        let updatedLogs;
        
        if (wasStartAction) {
          // Add new log entry
          updatedLogs = [...(schedule.task_logs || []), newLogData];
        } else {
          // Update existing log entry
          updatedLogs = schedule.task_logs?.map(log => 
            log.id === newLogData.id ? { ...log, ...newLogData } : log
          ) || [];
        }
        
        return {
          ...schedule,
          task_logs: updatedLogs
        };
      }
      return schedule;
    });
    
    setTaskSchedules(updatedSchedules);
  };
  
  // Update tasks data locally
  const updateTasksDataLocally = (taskId, scheduleId, newLogData, wasStartAction) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const updatedSchedules = task.task_schedules?.map(schedule => {
          if (schedule.id === scheduleId) {
            let updatedLogs;
            
            if (wasStartAction) {
              // Add new log entry
              updatedLogs = [...(schedule.task_logs || []), newLogData];
            } else {
              // Update existing log entry
              updatedLogs = schedule.task_logs?.map(log => 
                log.id === newLogData.id ? { ...log, ...newLogData } : log
              ) || [];
            }
            
            return {
              ...schedule,
              task_logs: updatedLogs
            };
          }
          return schedule;
        }) || [];
        
        return {
          ...task,
          task_schedules: updatedSchedules
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    
    // Update selectedTask if it's the same task
    if (selectedTask && selectedTask.id === taskId) {
      const updatedSelectedTask = updatedTasks.find(task => task.id === taskId);
      setSelectedTask(updatedSelectedTask);
    }
  };

  // Function to handle remarks submission
  const handleRemarksSubmit = (shouldStart, scheduleId, taskId, lastLog) => {
    handleSaveLog(shouldStart, scheduleId, taskId, lastLog, remarks);
  };

  // Function to toggle remarks input
  const toggleRemarksInput = (taskId, logRemarks) => {
    if (showRemarksInput === taskId) {
      setShowRemarksInput(null);
      setRemarks("");
    } else {
      setShowRemarksInput(taskId);
      setRemarks(logRemarks);
    }
  };

  const findCurrentSchedule = (schedules) => {
    const now = dayjs();

    return schedules?.find(schedule => {
      const startTime = toIndianTime(schedule.start_time);
      const endTime = toIndianTime(schedule.end_time);

      // Check if schedule is currently active
      const isTimeActive = now.isAfter(startTime) && now.isBefore(endTime) ||  // In between start and end
                          now.isSame(startTime) || now.isSame(endTime) ||      // Exactly at start or end time
                          (endTime === null && now.isAfter(startTime));        // If end_time is null, check if current time is after start_time
      
      // Also check if there's a running log (end_time is null)
      const hasRunningLog = schedule.task_logs?.some(log => log.end_time === null);
      
      return isTimeActive || hasRunningLog;
    });
  };

  const getButtonText = () => {
    if (!canLog) {
      switch (scheduleStatus.status) {
        case 'no_schedule':
          return 'No Schedule';
        case 'upcoming':
          return `Starts ${dayjs(scheduleStatus.schedule.start_time).format('HH:mm')}`;
        case 'no_active':
          return 'Not Active';
        default:
          return 'Unavailable';
      }
    }
    return shouldShowStartButton ? "Start" : "End";
  };

  return (
    <div className="w-full">
      <div className="p-2 pt-0 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Clipboard className="w-5 h-5 mr-2 text-gray-600" />
            Tasks List
          </h2>
          
          <div className="flex items-center gap-2">
            <select
              value={currentCategory}
              onChange={(e) => setCurrentCategory(e.target.value)}
              className="text-xs border border-gray-200 rounded-md py-1 px-2 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>

            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              className="text-xs border border-gray-200 rounded-md py-1 px-2 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="pt-3 pb-3 space-y-3 h-146 overflow-y-auto">
        {tasks.length > 0 ? (
          (() => {
            const filteredTasks = tasks.filter(task => 
              task.status === currentStatus && 
              (currentCategory === "all" || task.category === currentCategory)
            );
            
            return filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const canLog = (task.status == statuses[5] || task.status == statuses[1]) && task.task_schedules?.length > 0; // && dayjs(task.task_schedules?.[0]?.end_time).isAfter(dayjs());  // to expire the task after end time
                const remainingSchedules = task.task_schedules?.slice(1);
                const currentSchedule = findCurrentSchedule(remainingSchedules) || task.task_schedules?.[0];
                const scheduleId = currentSchedule?.id;
                const lastLog = currentSchedule?.task_logs?.[currentSchedule.task_logs.length - 1];
                const shouldShowStartButton = !lastLog || lastLog.end_time;
                return (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                    canLog && !shouldShowStartButton 
                      ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-2 ring-green-200 ring-opacity-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {/* Task content - keep all your existing task card content here */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm mb-2">{task.title}</h3>
                      
                      {/* Enhanced category/subcategory section */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {task.category}
                        </span>
                        {task.sub_category && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                              {task.sub_category}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {canLog && (
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            {showRemarksInput !== task.id && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRemarksInput(task.id, shouldShowStartButton ? "" : lastLog?.remarks || "");
                                }}
                                className={`text-xs h-7 px-3 flex items-center transition-all duration-200 ${
                                  !shouldShowStartButton 
                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-md' 
                                    : 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                                }`}
                                disabled={isPending}
                              >
                                {showRemarksInput === task.id && isPending ? (
                                  <>
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    {shouldShowStartButton ? (
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                      </svg>
                                    ) : (
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                    {shouldShowStartButton ? "Start" : "End"}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced running time section */}
                  {canLog && !shouldShowStartButton && lastLog && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-800">Task in Progress</p>
                            <p className="text-xs text-green-600">
                              Started at {formatDateTime(lastLog.start_time).split(',')[1]?.trim()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-700">
                            {Math.floor((Date.now() - new Date(toIndianTime(lastLog.start_time))) / 60000)}
                            <span className="text-sm font-normal ml-1">min</span>
                          </p>
                          <p className="text-xs text-green-600">Duration</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Remarks input section */}
                  {showRemarksInput === task.id && (
                    <div 
                      className="mt-3 overflow-hidden animate-in slide-in-from-top-3 duration-500 ease-out"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="backdrop-blur-sm bg-white/70 border border-white/20 rounded-xl p-4 shadow-lg ring-1 ring-black/5">
                        {/* Animated header */}
                        <div className="flex items-center gap-3 mb-4 animate-in fade-in duration-700">
                          <div className="relative">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </div>
                            {/* Pulse animation ring */}
                            <div className="absolute inset-0 w-8 h-8 bg-blue-400 rounded-full animate-ping opacity-20"></div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800">
                              {shouldShowStartButton ? '🚀 Starting Task' : '🏁 Completing Task'}
                            </h4>
                            <p className="text-xs text-gray-500">Add your thoughts or notes</p>
                          </div>
                        </div>

                        {/* Enhanced textarea with floating label effect */}
                        <div className="relative mb-4">
                          <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder=" "
                            className="peer w-full text-sm p-2 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-transparent"
                            rows={3}
                            autoFocus
                            maxLength={500}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                toggleRemarksInput(task.id);
                              } else if (e.key === 'Enter' && e.ctrlKey) {
                                handleRemarksSubmit(shouldShowStartButton, scheduleId, task.id, lastLog);
                              }
                            }}
                          />
                          {/* Floating label */}
                          {/* <label className="absolute left-4 top-4 text-sm text-gray-500 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-blue-600 bg-white/80 px-1 rounded">
                            {`Remarks for ${shouldShowStartButton ? 'starting' : 'ending'} this task...`}
                          </label> */}
                          
                          {/* Character counter with progress bar */}
                          <div className="absolute bottom-2 right-3 flex items-center gap-2">
                            <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  remarks.length > 400 ? 'bg-red-400' : remarks.length > 250 ? 'bg-yellow-400' : 'bg-green-400'
                                }`}
                                style={{ width: `${(remarks.length / 500) * 100}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs ${remarks.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                              {remarks.length}/500
                            </span>
                          </div>
                        </div>

                        {/* Action buttons with micro-interactions */}
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500 w-50">
                            Press Esc to cancel or Enter to submit
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRemarksInput(task.id);
                              }}
                              className="text-xs h-8 px-3 hover:bg-gray-50 hover:scale-105 transition-all duration-200 border-gray-300"
                              disabled={isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemarksSubmit(shouldShowStartButton, scheduleId, task.id, lastLog);
                              }}
                              className={`text-xs h-8 px-4 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${
                                shouldShowStartButton 
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                              }`}
                              disabled={isPending}
                            >
                              {isPending ? (
                                <div className="flex items-center">
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Processing...
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  {shouldShowStartButton ? "🚀 Start" : "🏁 Complete"}
                                </div>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )})
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Clipboard className="h-12 w-12 mb-2 opacity-20" />
                <p>No tasks match your filters</p>
              </div>
            );
          })()
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Clipboard className="h-12 w-12 mb-2 opacity-20" />
            <p>No tasks available</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedTask} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selectedTask && (
            <>

              {isEditing ? (
                <div className="">
                  <form onSubmit={handleTaskUpdate}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm({...editForm, category: e.target.value, sub_category: ""})}
                            className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            {Object.keys(categories_and_subcategories).map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                          <select
                            value={editForm.sub_category}
                            onChange={(e) => setEditForm({...editForm, sub_category: e.target.value})}
                            className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            disabled={!editForm.category}
                          >
                            <option value="">None</option>
                            {editForm.category && categories_and_subcategories[editForm.category]?.map((sub) => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <DialogHeader className="pb-2 border-b">
                    <div className="flex justify-between items-center">
                      <Badge className={`mb-2 ${getStatusColor(selectedTask.status)}`}>
                        {selectedTask.status || "Pending"}
                      </Badge>
                    </div>
                    <DialogTitle className="text-xl">{selectedTask.title}</DialogTitle>
                    <DialogDescription className="text-sm flex items-center space-x-1 mt-1">
                      <span>{selectedTask.category}</span>
                      {selectedTask.sub_category && (
                        <>
                          <ArrowRight className="h-3 w-3" />
                          <span>{selectedTask.sub_category}</span>
                        </>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {selectedTask.description || "No description provided."}
                    </p>
                  </div>
                  
                </>
              )}

              {isScheduleEnabled && (
                <DateTimePickerForm 
                  setIsScheduleEnabled={setIsScheduleEnabled}
                  taskId={selectedTask.id} 
                  selectedTask={selectedTask}
                  setSelectedTask={setSelectedTask}
                />
              )}

              {!isEditing && !isScheduleEnabled && selectedTask.task_schedules?.length > 0 && (
                <div className="border-t pt-3">
                  {/* Main toggle header for all schedules */}
                  <div 
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors duration-200 mb-3"
                    onClick={() => {
                      if (expandedSchedules.size === selectedTask.task_schedules.length) {
                        setExpandedSchedules(new Set());
                      } else {
                        setExpandedSchedules(new Set(selectedTask.task_schedules.map(s => s.id)));
                      }
                    }}
                  >
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      Scheduled Times & Activity Logs
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {selectedTask.task_schedules.length} schedule{selectedTask.task_schedules.length !== 1 ? 's' : ''}
                      </span>
                    </h4>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {expandedSchedules.size === selectedTask.task_schedules.length ? 'Collapse All' : 'Expand All'}
                      </span>
                      <svg 
                        className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                          expandedSchedules.size > 0 ? 'rotate-180' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Individual schedules */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {selectedTask.task_schedules.map((schedule) => (
                      <div key={schedule.id} className="bg-gray-50 rounded-md border border-gray-100">
                        {/* Schedule Header - Always Visible */}
                        <div 
                          className="p-3 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                          onClick={() => toggleSchedule(schedule.id)}
                        >
                          <div className="flex justify-between items-center">
                            <h5 className="text-sm font-medium text-gray-700 flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                              Schedule #{schedule.id}
                              {schedule.task_logs?.some(log => !log.end_time) && (
                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium animate-pulse">
                                  LIVE
                                </span>
                              )}
                            </h5>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                                {calculateDuration(schedule.start_time, schedule.end_time) > 0
                                  ? `${calculateDuration(schedule.start_time, schedule.end_time)} min`
                                  : "Invalid duration"}
                              </span>
                              <svg 
                                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                                  expandedSchedules.has(schedule.id) ? 'rotate-180' : ''
                                }`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          
                          {/* Quick preview when collapsed */}
                          {!expandedSchedules.has(schedule.id) && (
                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                {formatDateTime(schedule.start_time).split(',')[0]}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {formatDateTime(schedule.start_time).split(',')[1]?.trim()} - {formatDateTime(schedule.end_time).split(',')[1]?.trim()}
                              </span>
                              {schedule.task_logs?.length > 0 && (
                                <span className="flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {schedule.task_logs.length} log{schedule.task_logs.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Collapsible Schedule Content */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          expandedSchedules.has(schedule.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="px-3 pb-3">
                            {/* Time details */}
                            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
                              <div className="flex items-center p-2 bg-white rounded border border-gray-100">
                                <Clock className="h-3.5 w-3.5 mr-2 text-green-500" />
                                <div>
                                  <p className="text-gray-500 font-medium">Start</p>
                                  <p className="text-gray-700">{formatDateTime(schedule.start_time)}</p>
                                </div>
                              </div>
                              <div className="flex items-center p-2 bg-white rounded border border-gray-100">
                                <Clock className="h-3.5 w-3.5 mr-2 text-red-500" />
                                <div>
                                  <p className="text-gray-500 font-medium">End</p>
                                  <p className="text-gray-700">{formatDateTime(schedule.end_time)}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Activity Logs Section with Toggle */}
                            {schedule.task_logs?.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                {/* Logs Toggle Header */}
                                <div 
                                  className="flex items-center justify-between p-2 hover:bg-white rounded-md cursor-pointer transition-colors duration-200 mb-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLogs(schedule.id);
                                  }}
                                >
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs font-medium text-gray-600">Activity Logs</p>
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                      {schedule.task_logs.length} log{schedule.task_logs.length !== 1 ? 's' : ''}
                                    </span>
                                    {schedule.task_logs.some(log => !log.end_time) && (
                                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                        ACTIVE
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">
                                      {expandedLogs.has(schedule.id) ? 'Hide' : 'Show'}
                                    </span>
                                    <svg 
                                      className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${
                                        expandedLogs.has(schedule.id) ? 'rotate-180' : ''
                                      }`} 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                                
                                {/* Quick logs summary when collapsed */}
                                {!expandedLogs.has(schedule.id) && (
                                  <div className="bg-white p-2 rounded border border-gray-100 text-xs text-gray-600">
                                    <div className="flex justify-between items-center">
                                      <span>
                                        {schedule.task_logs.filter(log => log.end_time).length} completed, 
                                        {' '}{schedule.task_logs.filter(log => !log.end_time).length} running
                                      </span>
                                      <span className="text-gray-500">
                                        Total: {schedule.task_logs.reduce((acc, log) => 
                                          acc + (log.end_time ? calculateDuration(log.start_time, log.end_time) : 0), 0
                                        )} min
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Collapsible Logs Content */}
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                  expandedLogs.has(schedule.id) ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                  <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {schedule.task_logs.map((log) => (
                                      <div key={log.id} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center">
                                            <span className="text-xs font-medium text-gray-700 flex items-center">
                                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                                log.end_time ? 'bg-green-500' : 'bg-orange-500 animate-pulse'
                                              }`}></div>
                                              Log #{log.id}
                                            </span>
                                            {!log.end_time && (
                                              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                                RUNNING
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-xs text-gray-500 font-medium">
                                            {log.end_time && calculateDuration(log.start_time, log.end_time) > 0
                                              ? `${calculateDuration(log.start_time, log.end_time)} min`
                                              : "In progress"}
                                          </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div className="flex items-center p-1.5 bg-green-50 rounded border border-green-200">
                                            <svg className="w-3 h-3 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <div>
                                              <p className="text-green-600 font-medium">Started</p>
                                              <p className="text-gray-700">{formatDateTime(log.start_time)}</p>
                                            </div>
                                          </div>
                                          
                                          <div className={`flex items-center p-1.5 rounded border ${
                                            log.end_time 
                                              ? 'bg-red-50 border-red-200' 
                                              : 'bg-orange-50 border-orange-200'
                                          }`}>
                                            <svg className={`w-3 h-3 mr-1 ${
                                              log.end_time ? 'text-red-600' : 'text-orange-600'
                                            }`} fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            <div>
                                              <p className={`font-medium ${
                                                log.end_time ? 'text-red-600' : 'text-orange-600'
                                              }`}>
                                                {log.end_time ? 'Ended' : 'Running'}
                                              </p>
                                              <p className="text-gray-700">
                                                {log.end_time ? formatDateTime(log.end_time) : 'In progress...'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Remarks section */}
                                        {log.remarks && (
                                          <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100">
                                            <p className="text-xs text-gray-500 font-medium mb-1">Remarks:</p>
                                            <p className="text-xs text-gray-700 italic">"{log.remarks}"</p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-4 pt-3 border-t align-middle gap-2">
                {!isEditing && 
                  <Button 
                    // variant="outline" 
                    size="sm" 
                    onClick={() => {setIsScheduleEnabled(false); setIsEditing(true)}}
                    className="text-xs h-8 px-3 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      <path d="m15 5 4 4"/>
                    </svg>
                    Edit Task
                  </Button>
                }
                {!isScheduleEnabled && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => {setIsEditing(false); setIsScheduleEnabled(true)}} 
                      className="text-xs h-8 px-3 flex items-center"
                      // disabled={selectedTask.status == statuses[5] && selectedTask.task_schedules?.length > 0}
                    >
                      <Calendar className="h-4 w-4 mr-1.5" />
                      Schedule Task
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskList;