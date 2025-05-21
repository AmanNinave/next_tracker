"use client";

import React, { useCallback, useState } from "react";
import { useDateStore, useEventStore } from "../../lib/store";
import EventPopover from "./event-popover";
import { PlusCircle } from "lucide-react";

export default function Create() {
  const { openPopover } = useEventStore();

  return (
    <>
      <button
        type="button"
        onClick={openPopover}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 flex items-center"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Create
      </button>
    </>
  );
}