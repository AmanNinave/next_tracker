"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DateTimePickerForm from "../time-picker/date-time-picker-form";
import { Calendar, Clock, Clipboard, ArrowRight } from "lucide-react"; // Import icons
import { Badge } from "@/components/ui/badge"; // Assuming you have a Badge component from your UI library

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
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Clipboard className="w-5 h-5 mr-2 text-gray-600" />
          Tasks List
        </h2>
      </div>
      
      <div className="p-3 space-y-3 h-80 overflow-y-auto">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className="cursor-pointer rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:shadow-md hover:border-gray-300 bg-white"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <Badge className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                  {task.status || "Pending"}
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
            <p>No tasks available</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedTask} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selectedTask && (
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

              {selectedTask.task_schedules?.length > 0 && (
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
                
              <div className="flex justify-end mt-4 pt-3 border-t">
                {!isScheduleEnabled ? (
                  <Button onClick={() => setIsScheduleEnabled(true)} className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Task
                  </Button>
                ) : (
                  <DateTimePickerForm taskId={selectedTask.id} setIsScheduleEnabled={setIsScheduleEnabled} />
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