"use client"
import React, { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
 
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
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
  
const formSchema = z.object({
  start_time: z.date(),
  end_time: z.date(),
  remarks: z.string().optional(),
}).refine((data) => data.end_time > data.start_time, {
  message: "End time must be after start time",
  path: ["end_time"],
});

const DateTimePickerForm = ({setIsScheduleEnabled, taskId}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_time: undefined,
      end_time: undefined,
      remarks: "",
    },
  })
 
  async function onSubmit(values) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await createNewScheduleEntry({...values, task_id: taskId});
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
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
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
                  Schedule Task
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