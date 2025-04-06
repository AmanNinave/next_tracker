"use client";

import React, { useRef, useEffect, useState, useTransition, useMemo } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { IoCloseSharp } from "react-icons/io5";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteEvent, updateEventField } from "@/app/actions/task-actions";
import AddTime from "./add-time";
import { categories, subcategories, breakCategories, statuses } from "@/utils/constants";
import { FiClock } from "react-icons/fi";

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

export function EventSummaryPopover({ isOpen, onClose, event }) {
  const popoverRef = useRef(null);
  const [editableEvent, setEditableEvent] = useState(event);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [updatedData, setUpdatedData] = useState({});
  const [isBreakBoxActive, setIsBreakBoxActive] = useState(false);
  const [breaksObj, setBreaksObj] = useState({ remark: '', category: breakCategories[0] });
  const [showBreaks, setShowBreaks] = useState(false);

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

  const handleChange = (field, value) => {
    let updatedValue = value;

    if (field === 'plannedEndTime' || field === 'plannedStartTime') {
      if (event[field] !== undefined && event[field] !== null) {
        updatedValue = `${dayjs(event[field]).format("YYYY-MM-DD")}T${value}:00`;
      } else {
        updatedValue = null;
      }
    } else if (field === 'actualEndTime' || field === 'actualStartTime') {
      updatedValue = new Date();
    }

    setUpdatedData((prev) => ({
      ...prev,
      [field]: updatedValue,
    }));

    setEditableEvent((prev) => ({
      ...prev,
      [field]: updatedValue,
    }));
  };

  const handleSave = (updatedData) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await updateEventField(+event.id, updatedData);
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

  const handleDelete = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await deleteEvent(+event.id);
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


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div
        ref={popoverRef}
        className="w-full max-w-md rounded-lg bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between rounded-md bg-slate-100 p-1">
          <div className="flex items-center space-x-3 text-sm">
            <FiClock className="size-5 text-gray-600 ml-1" />
            <p>{dayjs(editableEvent.start_time).format("dddd, MMMM D YYYY")}</p>
          </div>
          <Button variant="ghost" size="icon" type="button" onClick={onClose}>
            <IoCloseSharp className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-center gap-1">
          <Button onClick={handleDelete}>Delete</Button>
          <Button onClick={() => setIsEditMode(!isEditMode)}>{!isEditMode ? "Edit" : "View"}</Button>
          <Button disabled={!!event.actualEndTime} onClick={() => { handleSave({ [!event.actualStartTime ? "actualStartTime" : "actualEndTime"]: (new Date()).toString() }) }}>{!event.actualStartTime ? "Start" : "End"}</Button>
        </div>
      </div>
    </div>
  );
}