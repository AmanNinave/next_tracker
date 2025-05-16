import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { updateTask } from '@/app/actions/task-actions';

const RecurringForm = ({ setIsRecurringEnabled, setIsRecurringDataSaved, isRecurringDataSaved, selectedTask }) => {
  const [pattern, setPattern] = useState('daily');
  const [interval, setInterval] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedMonthDays, setSelectedMonthDays] = useState([]); // Replace monthlyDay with selectedMonthDays
  const [selectedMonths, setSelectedMonths] = useState([]);
  
  // Helper function to toggle selected days of week
  const toggleDay = (dayIndex) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(day => day !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };
  
  // Helper function to toggle selected days of month
  const toggleMonthDay = (dayNum) => {
    if (selectedMonthDays.includes(dayNum)) {
      setSelectedMonthDays(selectedMonthDays.filter(day => day !== dayNum));
    } else {
      setSelectedMonthDays([...selectedMonthDays, dayNum]);
    }
  };
  
  // Helper function to toggle selected months
  const toggleMonth = (monthIndex) => {
    if (selectedMonths.includes(monthIndex)) {
      setSelectedMonths(selectedMonths.filter(month => month !== monthIndex));
    } else {
      setSelectedMonths([...selectedMonths, monthIndex]);
    }
  };
  
  // Helper function for ordinal suffixes (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Build a more comprehensive recurrence object
        const recurrenceData = {
            pattern,
            interval: parseInt(interval),
            selectedDays: pattern === 'weekly' ? selectedDays : [],
            selectedMonthDays: pattern === 'monthly' ? selectedMonthDays : [], // Update to use selectedMonthDays
            selectedMonths: pattern === 'yearly' ? selectedMonths : [],
        };
      
        // Send the recurrence data to the server
        const response = await updateTask(selectedTask.id, {...selectedTask, settings: {...selectedTask.settings, recurrence : recurrenceData } });
      
        if (response.success) {
            setIsRecurringDataSaved(true);
        }
    } catch (error) {
      console.error("Failed to set recurring schedule:", error);
      setIsRecurringEnabled(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // List of month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return (
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
        
        <div className="flex justify-end space-x-2 pt-3">
          {/* <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsRecurringEnabled(false)}
            className="text-xs h-8"
          >
            Cancel
          </Button> */}
          <Button 
            type="submit"
            className="text-xs h-8"
            onClick={handleSubmit}
          >
            {isRecurringDataSaved ? "Saved" : isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </fieldset>
    </div>
  );
};

export default RecurringForm;