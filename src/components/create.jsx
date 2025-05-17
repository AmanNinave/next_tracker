"use client";

import React, { useCallback, useState } from "react";
import { useDateStore } from "../../lib/store";
import { SvgIcons } from "./svg-icons";
import EventPopover from "./event-popover";
import { PlusCircle } from "lucide-react";

export default function Create() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleOpenPopover = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPopoverOpen(true);
  }, []);

  const handleClosePopover = useCallback(() => {
    setIsPopoverOpen(false);
  }, []);

  const { userSelectedDate } = useDateStore();

  return (
    <>
      <button
        type="button"
        onClick={handleOpenPopover}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 flex items-center"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Create
      </button>
      
      {isPopoverOpen && (
        <EventPopover
          isOpen={isPopoverOpen}
          onClose={handleClosePopover}
          date={userSelectedDate.format("YYYY-MM-DD")}
        />
      )}
    </>
  );
}