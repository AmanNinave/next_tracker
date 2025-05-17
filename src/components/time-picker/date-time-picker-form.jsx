"use client"
import React, { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
 
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, Clock, X, CheckCircle } from "lucide-react"
import { cn } from '../../../lib/utils'
import { TimePicker } from './time-picker'
import { format } from 'date-fns'
import { createNewScheduleEntry } from '@/app/api/tasks/route'
import { updateTask } from '@/app/actions/task-actions'
import { useEventStore } from '../../../lib/store'
  
const formSchema = z.object({
  start_time: z.date(),
  end_time: z.date(),
  remarks: z.string().optional(),
}).refine((data) => data.end_time > data.start_time, {
  message: "End time must be after start time",
  path: ["end_time"],
});

const DateTimePickerForm = ({setIsScheduleEnabled, taskId, selectedTask}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isRecurringEnabled, setIsRecurringEnabled] = useState(false);
  const {tasks, setTasks, taskSchedules, setTaskSchedules} = useEventStore();

  // RecurringForm state
  const [pattern, setPattern] = useState('daily');
  const [interval, setInterval] = useState(1);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedMonthDays, setSelectedMonthDays] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_time: undefined,
      end_time: undefined,
      remarks: "",
    },
  })
  
  // Helper functions from RecurringForm
  const toggleDay = (dayIndex) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(day => day !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };
  
  const toggleMonthDay = (dayNum) => {
    if (selectedMonthDays.includes(dayNum)) {
      setSelectedMonthDays(selectedMonthDays.filter(day => day !== dayNum));
    } else {
      setSelectedMonthDays([...selectedMonthDays, dayNum]);
    }
  };
  
  const toggleMonth = (monthIndex) => {
    if (selectedMonths.includes(monthIndex)) {
      setSelectedMonths(selectedMonths.filter(month => month !== monthIndex));
    } else {
      setSelectedMonths([...selectedMonths, monthIndex]);
    }
  };
  
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  // List of month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
 
  // Main form submission
  async function onSubmit(values) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (isRecurringEnabled) {
        values.remarks = "recurring"
      }
      
      let scheduleResponse = await createNewScheduleEntry({...values, task_id: taskId});

      setTaskSchedules([...taskSchedules, scheduleResponse]);

      if( scheduleResponse?.id ){
        if(isRecurringEnabled){
          const recurrenceData = {
            pattern,
            interval: parseInt(interval),
            selectedDays: pattern === 'weekly' ? selectedDays : [],
            selectedMonthDays: pattern === 'monthly' ? selectedMonthDays : [],
            selectedMonths: pattern === 'yearly' ? selectedMonths : [],
          };

          // Send the recurrence data to the server
          const response = await updateTask(selectedTask.id, {
            ...selectedTask, 
            settings: {...selectedTask.settings, recurrence: {...selectedTask.settings.recurrence, [scheduleResponse.id]: recurrenceData }  }
          });
          debugger;
          let updatedTasks = tasks.map(task =>
            task.id === selectedTask.id ? {
              ...selectedTask, 
              settings: {...selectedTask.settings, recurrence: {...selectedTask.settings.recurrence, [scheduleResponse.id]: recurrenceData }  },
              task_schedules : [...selectedTask.task_schedules, scheduleResponse]
            } : task
          );
          setTasks(updatedTasks);
        }else{
          debugger;
          let updatedTasks = tasks.map(task =>
            task.id === selectedTask.id ? {
              ...selectedTask, 
              task_schedules : [...selectedTask.task_schedules, scheduleResponse]
            } : task
          );
          setTasks(updatedTasks);
        }
      }
      setIsScheduleEnabled(false);
    } catch (err) {
      setError(err.message || "Failed to schedule task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full bg-white rounded-md p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-gray-600" />
          Schedule Task
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsScheduleEnabled(false)}
          className="h-8 w-8 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid md:grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-gray-700">Start Time</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal border-gray-300 hover:bg-gray-50",
                          !field.value && "text-gray-500"
                        )}
                      >
                        <Clock className="mr-2 h-4 w-4 text-gray-500" />
                        {field.value ? format(field.value, "PPP - HH:mm:ss") : <span>Select start time</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-md rounded-md">
                      <div className="p-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Select Date</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-gray-500 hover:text-gray-800"
                          onClick={() => field.onChange(new Date())}
                        >
                          Today
                        </Button>
                      </div>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="border-b border-gray-100"
                      />
                      <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs font-medium text-gray-700 mb-2">Select Time</p>
                        <TimePicker setDate={field.onChange} date={field.value} />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-gray-700">End Time</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal border-gray-300 hover:bg-gray-50",
                          !field.value && "text-gray-500"
                        )}
                      >
                        <Clock className="mr-2 h-4 w-4 text-gray-500" />
                        {field.value ? format(field.value, "PPP - HH:mm:ss") : <span>Select end time</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-md rounded-md">
                      <div className="p-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Select Date</span>
                        {field.value && (
                          <div className="text-xs text-gray-500">
                            {form.getValues().start_time && 
                              `Duration: ${Math.round((field.value - form.getValues().start_time) / 60000)} min`
                            }
                          </div>
                        )}
                      </div>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="border-b border-gray-100"
                      />
                      <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs font-medium text-gray-700 mb-2">Select Time</p>
                        <TimePicker setDate={field.onChange} date={field.value} />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium text-gray-700">Remarks</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any notes or remarks about this scheduled time..."
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />

          {/* Integrated recurring form */}
          {isRecurringEnabled && (
            <div className="w-full bg-white rounded-md p-4 border border-gray-200 shadow-sm">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Set Recurring Schedule</h4>
              
              <fieldset className="space-y-4">
                {/* Form fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Pattern</label>
                  <select
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                
                {/* Weekly pattern with day selection */}
                <div className={pattern === 'weekly' ? 'block' : 'hidden'}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days of Week</label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <div key={day} className="flex items-center">
                        <input 
                          type="checkbox" 
                          id={`day-${index}`}
                          checked={selectedDays.includes(index)}
                          onChange={() => toggleDay(index)}
                          className="mr-1 rounded"
                        />
                        <label htmlFor={`day-${index}`} className="text-sm">{day}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly pattern with date selection as checkboxes */}
                <div className={pattern === 'monthly' ? 'block' : 'hidden'}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days of Month</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {[...Array(31)].map((_, i) => {
                      const dayNum = i + 1;
                      return (
                        <div key={dayNum} className="flex items-center">
                          <input 
                            type="checkbox" 
                            id={`month-day-${dayNum}`}
                            checked={selectedMonthDays.includes(dayNum)}
                            onChange={() => toggleMonthDay(dayNum)}
                            className="mr-1 rounded"
                          />
                          <label htmlFor={`month-day-${dayNum}`} className="text-sm">
                            {dayNum}<sup>{getOrdinalSuffix(dayNum)}</sup>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Yearly pattern with month selection */}
                <div className={pattern === 'yearly' ? 'block' : 'hidden'}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Months of Year</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {months.map((month, index) => (
                      <div key={month} className="flex items-center">
                        <input 
                          type="checkbox" 
                          id={`month-${index}`}
                          checked={selectedMonths.includes(index)}
                          onChange={() => toggleMonth(index)}
                          className="mr-1 rounded"
                        />
                        <label htmlFor={`month-${index}`} className="text-sm">{month}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Every</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="1"
                      value={interval}
                      onChange={(e) => setInterval(e.target.value)}
                      className="w-20 p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-600">
                      {pattern === 'daily' ? 'days' : 
                       pattern === 'weekly' ? 'weeks' : 
                       pattern === 'monthly' ? 'months' : 'years'}
                    </span>
                  </div>
                </div>
                
              </fieldset>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
            <Button 
              variant={isRecurringEnabled ? "default" : "outline"}
              type="button"
              size="sm" 
              onClick={() => {setIsRecurringEnabled(prevState => !prevState)}} 
              className={`text-xs h-8 px-3 flex items-center }`}
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                <path d="M2 12a10 10 0 0 1 10-10v2a8 8 0 0 0-8 8h2l-4 4-4-4h2Z"/>
                <path d="M22 12a10 10 0 0 1-10 10v-2a8 8 0 0 0 8-8h-2l4-4 4 4h-2Z"/>
              </svg>
              {isRecurringEnabled ? "Cancel Recurring" : "Make Recurring"}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsScheduleEnabled(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {"Schedule Task"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default DateTimePickerForm