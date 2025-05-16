"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DateTimePickerForm from "../time-picker/date-time-picker-form";
import { Calendar, Clock, Clipboard, ArrowRight } from "lucide-react"; // Import icons
import { Badge } from "@/components/ui/badge"; // Assuming you have a Badge component from your UI library
import { statuses, categories_and_subcategories } from "@/utils/constants";
import { updateTask } from "@/app/actions/task-actions";
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

const TaskList = ({ tasks }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(statuses[1]);
  const [currentCategory, setCurrentCategory] = useState("all");

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    sub_category: "",
    status: ""
  });

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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
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
      
      <div className="pt-3 pb-3 space-y-3 h-80 overflow-y-auto">
        {tasks.length > 0 ? (
          (() => {
            const filteredTasks = tasks.filter(task => 
              task.status === currentStatus && 
              (currentCategory === "all" || task.category === currentCategory)
            );
            
            return filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="cursor-pointer rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:shadow-md hover:border-gray-300 bg-white"
                >
                  {/* Task content - keep all your existing task card content here */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <Badge className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                      {task.status || currentStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 space-x-2">
                    <span>{task.category}</span>
                    {task.sub_category && (
                      <>
                        <span>•</span>
                        <span>{task.sub_category}</span>
                      </>
                    )}
                  </div>
                  {task.task_schedules?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>
                        Next: {formatDateTime(task.task_schedules[0].start_time)}
                      </span>
                    </div>
                  )}
                </div>
              ))
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
                />
              )}

              {!isScheduleEnabled && selectedTask.task_schedules?.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                    Scheduled Times
                  </h4>
                  <div className="space-y-3">
                    {selectedTask.task_schedules.map((schedule) => (
                      <div key={schedule.id} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="text-sm font-medium text-gray-700">Schedule #{schedule.id}</h5>
                          <span className="text-xs text-gray-500">
                            {new Date(schedule.end_time).getTime() - new Date(schedule.start_time).getTime() > 0
                              ? `${Math.round((new Date(schedule.end_time).getTime() - new Date(schedule.start_time).getTime()) / 60000)} min`
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
                                      {log.end_time && new Date(log.end_time).getTime() - new Date(log.start_time).getTime() > 0
                                        ? `${Math.round((new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 60000)} min`
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
                  <Button 
                    size="sm" 
                    onClick={() => {setIsEditing(false); setIsScheduleEnabled(true)}} 
                    className="text-xs h-8 px-3 flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-1.5" />
                    Schedule Task
                  </Button>
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