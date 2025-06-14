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

  // Function to handle remarks submission
  const handleRemarksSubmit = (shouldStart, scheduleId, taskId, lastLog) => {
    handleSaveLog(shouldStart, scheduleId, taskId, lastLog, remarks);
  };

  // Function to toggle remarks input
  const toggleRemarksInput = (taskId) => {
    if (showRemarksInput === taskId) {
      setShowRemarksInput(null);
      setRemarks("");
    } else {
      setShowRemarksInput(taskId);
      setRemarks("");
    }
  };

  const findCurrentSchedule = (schedules) => {
    const now = dayjs();
    return schedules?.find(schedule => {
      const startTime = dayjs(schedule.start_time);
      const endTime = dayjs(schedule.end_time);

      // Check if schedule is currently active
      const isTimeActive = now.isAfter(startTime) && now.isBefore(endTime) || 
                          now.isSame(startTime) || 
                          now.isSame(endTime) || 
                          (schedule.end_time === null && now.isAfter(startTime));
      
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
                  className="cursor-pointer rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:shadow-md hover:border-gray-300 bg-white"
                >
                  {/* Task content - keep all your existing task card content here */}
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900 w-50 overflow-ellipsis">{task.title}</h3>
                    <div className="flex justify-items-start w-40 items-center text-xs text-gray-500 space-x-2 overflow-ellipsis">
                      <span>{task.category}</span>
                      {task.sub_category && (
                        <>
                          <span>•</span>
                          <span>{task.sub_category}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 w-12">
                      {canLog && (
                        <div className="flex flex-col space-y-2">
                          {/* Main action buttons */}
                          <div className="flex items-center space-x-2 ">
                            { showRemarksInput !== task.id && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (showRemarksInput === task.id) {
                                    handleRemarksSubmit(shouldShowStartButton, scheduleId, task.id, lastLog);
                                  } else {
                                    toggleRemarksInput(task.id);
                                  }
                                }}
                                className={`text-xs h-7 px-3 flex items-center ${showRemarksInput === task.id ? "" : ""}`}
                                disabled={isPending}
                              >
                                {isPending ? "Processing..." : shouldShowStartButton ? "Start" : "End"}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Remarks input section */}
                  {showRemarksInput === task.id && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-md" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder={`Add remarks for ${shouldShowStartButton ? 'starting' : 'ending'} this task...`}
                        className="w-full text-xs p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex justify-end space-x-1 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRemarksInput(task.id);
                          }}
                          className="text-xs h-6 px-2"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemarksSubmit(shouldShowStartButton, scheduleId, task.id, lastLog);
                          }}
                          className="text-xs h-6 px-2"
                          disabled={isPending}
                        >
                          {isPending ? "Processing..." : shouldShowStartButton ? "Start Task" : "End Task"}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* {task.task_schedules?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-around">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>
                          Start: {formatDateTime(task.task_schedules[0].start_time)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>
                          End: {formatDateTime(task.task_schedules[0].end_time)}
                        </span>
                      </div>
                    </div>
                  )} */}
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

              { !isEditing && !isScheduleEnabled && selectedTask.task_schedules?.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                    Scheduled Times (Indian Timezone)
                  </h4>
                  <div className="space-y-3">
                    {selectedTask.task_schedules.map((schedule) => (
                      <div key={schedule.id} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="text-sm font-medium text-gray-700">Schedule #{schedule.id}</h5>
                          <span className="text-xs text-gray-500">
                            {calculateDuration(schedule.start_time, schedule.end_time) > 0
                              ? `${calculateDuration(schedule.start_time, schedule.end_time)} min`
                              : "Invalid duration"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            <div>
                              <p className="text-gray-500">Start</p>
                              <p>{formatDateTime(schedule.start_time)}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            <div>
                              <p className="text-gray-500">End</p>
                              <p>{formatDateTime(schedule.end_time)}</p>
                            </div>
                          </div>
                        </div>
                        
                        {schedule.task_logs?.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-600 mb-1">Activity Logs</p>
                            <div className="space-y-1.5">
                              {schedule.task_logs.map((log) => (
                                <div key={log.id} className="bg-white p-2 rounded border border-gray-200 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Log #{log.id}</span>
                                    <span className="text-gray-500">
                                      {log.end_time && calculateDuration(log.start_time, log.end_time) > 0
                                        ? `${calculateDuration(log.start_time, log.end_time)} min`
                                        : "In progress"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between mt-1 text-gray-600">
                                    <span>{formatDateTime(log.start_time)}</span>
                                    {log.end_time ? (
                                      <span>{formatDateTime(log.end_time)}</span>
                                    ) : (
                                      <span className="italic text-amber-600">Running</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
                      disabled={selectedTask.status == statuses[5] && selectedTask.task_schedules?.length > 0}
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