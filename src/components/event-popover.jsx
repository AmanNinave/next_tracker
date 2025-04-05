import React, { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import dayjs from "dayjs";
import {
  HiOutlineMenuAlt2,
  HiOutlineMenuAlt4,
} from "react-icons/hi";
import { IoCloseSharp } from "react-icons/io5";
import { createTask } from "@/app/actions/task-actions";
import { cn } from "./../../lib/utils";
import { Textarea } from "./ui/textarea";
import { categories, subcategories, statuses } from "./../utils/constants";

export default function EventPopover({ isOpen, onClose, date }) {
  const popoverRef = useRef(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
      ) {
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

  const handleClose = (e) => {
    e.stopPropagation();
    onClose();
  };

  const handlePopoverClick = (e) => {
    e.stopPropagation();
  };

  async function onSubmit(formData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await createTask(formData);
        if ("error" in result) {
          setError(result.error);
        } else if (result.success) {
          setSuccess(result.success);
          setTimeout(() => {
            onClose();
          }, 200);
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  }


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleClose}
    >
      <div
        ref={popoverRef}
        className="w-full max-w-md rounded-lg bg-white shadow-lg"
        onClick={handlePopoverClick}
      >
        <div className="mb-2 flex items-center justify-between rounded-md bg-slate-100 p-1">
          <HiOutlineMenuAlt4 />
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={handleClose}
          >
            <IoCloseSharp className="h-4 w-4" />
          </Button>
        </div>

        <form className="space-y-4 p-6" action={onSubmit}>

          <div>
            <Input
              type="text"
              name="title"
              placeholder="Add title"
              className="my-4 rounded-none border-0 border-b text-2xl focus-visible:border-b-2 focus-visible:border-b-blue-600 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="flex justify-between gap-3 pl-3 pr-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-7"
              >
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="mb-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <select
                name="subCategory"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-7"
              >
                <option value="" disabled>Select a subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-start space-x-3 mt-4">
            <HiOutlineMenuAlt2 className="size-5 text-slate-600" />
            <Textarea
              name="description"
              placeholder="Add description"
              className={cn(
                "w-full rounded-lg border-0 bg-slate-100 pl-7 placeholder:text-slate-600",
                "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <div className="flex items-center space-x-4">
              {statuses.map((s) => (
                <label key={s} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="status"
                    value={s.toLowerCase()}
                    checked={status === s.toLowerCase()}
                    onChange={() => setStatus(s.toLowerCase())}
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>

          {error && <p className="mt-2 px-6 text-red-500">{error}</p>}
          {success && <p className="mt-2 px-6 text-green-500">Success</p>}
        </form>
      </div>
    </div>
  );
}
