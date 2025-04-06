"use client"
import React from 'react'
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

import { Calendar as CalendarIcon } from "lucide-react"
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
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_time: undefined,
      end_time: undefined,
      remarks: "",
    },
  })
 
  function onSubmit(values) {
    createNewScheduleEntry({...values , task_id : taskId });
    setIsScheduleEnabled(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="start_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start time</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                          "w-[250px] justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP - HH:mm:ss")  : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white">
                    <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    // disabled={(date) => date > new Date()}
                    initialFocus
                    />
                    <div className='p-3 border-t border-border'>
                      <TimePicker setDate={field.onChange} date={field.value} />
                    </div>
                </PopoverContent>
              </Popover>

            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="end_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End time</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                          "w-[250px] justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP - HH:mm:ss")  : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white">
                    <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    // disabled={(date) => date > new Date()}
                    initialFocus
                    />
                    <div className='p-3 border-t border-border'>
                      <TimePicker setDate={field.onChange} date={field.value} />
                    </div>
                </PopoverContent>
              </Popover>

            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  className="w-full border p-2 rounded"
                  placeholder="Enter remarks here..."
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
        <Button onClick={() => setIsScheduleEnabled(false) } className='ml-2'>Cancel</Button>
      </form>
    </Form>
  )
}

export default DateTimePickerForm