"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DateTimePickerForm from "../time-picker/date-time-picker-form";

const TaskList = ({ tasks }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(false)

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const closeDialog = () => {
    setSelectedTask(null);
  };

  return (
    <div className="border rounded p-1 shadow bg-white">
      <h2 className="text-lg font-semibold">Tasks List</h2>
      <div className="space-y-4 h-80 overflow-y-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => handleTaskClick(task)}
            className="cursor-pointer rounded border p-4 shadow hover:bg-gray-50"
          >
            <h3 className="font-semibold text-lg">{task.title}</h3>
            <p className="text-sm text-muted-foreground">{task.category} - {task.sub_category}</p>
          </div>
        ))}

        <Dialog open={!!selectedTask} onOpenChange={closeDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            {selectedTask && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedTask.title}</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {selectedTask.category} / {selectedTask.sub_category}
                  </DialogDescription>
                </DialogHeader>

                <p className="my-2">Status: <span className="font-medium">{selectedTask.status}</span></p>
                <p className="mb-4">Description: {selectedTask.description || "No description provided."}</p>

                <div className="space-y-4">
                  {selectedTask.task_schedules.map((schedule) => (
                    <div key={schedule.id} className="border p-3 rounded">
                      <p className="text-sm font-semibold">Schedule #{schedule.id}</p>
                      <p className="text-xs">Start: {new Date(schedule.start_time).toLocaleString()}</p>
                      <p className="text-xs">End: {new Date(schedule.end_time).toLocaleString()}</p>
                      {schedule.task_logs.length > 0 && (
                        <div className="mt-2 ml-2">
                          <p className="text-xs font-medium">Logs:</p>
                          {schedule.task_logs.map((log) => (
                            <div key={log.id} className="ml-2 text-xs">
                              • Log #{log.id}: {new Date(log.start_time).toLocaleString()} - {new Date(log.end_time).toLocaleString()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-6">
                  {!isScheduleEnabled ?
                    <Button onClick={() => setIsScheduleEnabled(true)}>
                      {"Schedule Task"}
                    </Button>
                    :
                    <DateTimePickerForm taskId={selectedTask.id} setIsScheduleEnabled={setIsScheduleEnabled} />
                  }
                </div>

              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TaskList;
