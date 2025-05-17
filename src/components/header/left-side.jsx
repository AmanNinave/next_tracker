"use client";

import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { useDateStore, useToggleSideBarStore, useViewStore } from "./../../../lib/store";
import dayjs from "dayjs";

export default function HeaderLeft(tasksData) {
  const [mounted, setMounted] = useState(false);
  const todaysDate = dayjs();
  const { userSelectedDate, setDate, setMonth, selectedMonthIndex } = useDateStore();
  const { setSideBarOpen } = useToggleSideBarStore();
  const { selectedView } = useViewStore();

  // Only render date content after component mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTodayClick = () => {
    switch (selectedView) {
      case "month":
        setMonth(dayjs().month());
        break;
      case "week":
        setDate(todaysDate);
        break;
      case "day":
        setDate(todaysDate);
        setMonth(dayjs().month());
        break;
      default:
        break;
    }
  };

  const handlePrevClick = () => {
    switch (selectedView) {
      case "month":
        setMonth(selectedMonthIndex - 1);
        break;
      case "week":
        setDate(userSelectedDate.subtract(1, "week"));
        break;
      case "day":
        setDate(userSelectedDate.subtract(1, "day"));
        break;
      default:
        break;
    }
  };

  const handleNextClick = () => {
    switch (selectedView) {
      case "month":
        setMonth(selectedMonthIndex + 1);
        break;
      case "week":
        setDate(userSelectedDate.add(1, "week"));
        break;
      case "day":
        setDate(userSelectedDate.add(1, "day"));
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Sidebar Toggle and Calendar Icon */}
      <div className="hidden items-center lg:flex">
        <Button
          variant="ghost"
          className="rounded-full p-2"
          onClick={() => setSideBarOpen()}
        >
          <Menu className="size-6" />
        </Button>
        {/* <Image
          src={`/img/calendar_${todaysDate.date().toString()}_2x.png`}
          width={40}
          height={40}
          alt="icon"
        />
        <h1 className="text-xl">Calendar</h1> */}
      </div>

      {/* Today Button */}
      {/* <Button variant="outline" onClick={handleTodayClick}>
        Today
      </Button> */}

      {/* Navigation Controls */}
      {/* <div className="flex items-center gap-3">
        <MdKeyboardArrowLeft
          className="size-6 cursor-pointer font-bold"
          onClick={handlePrevClick}
        />
        <MdKeyboardArrowRight
          className="size-6 cursor-pointer font-bold"
          onClick={handleNextClick}
        />
      </div> */}

      {/* Current Date Display - Only render after client mount */}
      {mounted ? (
        <h1 className="hidden text-xl lg:block">
          {selectedView === "month" && (
            dayjs(new Date(dayjs().year(), selectedMonthIndex)).format("MMMM YYYY")
          )}
          {selectedView === "week" && (
            <>
              {userSelectedDate.startOf('week').format("MMM D")} - {userSelectedDate.endOf('week').format("MMM D, YYYY")}
            </>
          )}
          {selectedView === "day" && (
            userSelectedDate.format("dddd, MMMM D, YYYY")
          )}
        </h1>
      ) : (
        <h1 className="hidden text-xl lg:block">
          {/* Empty placeholder with same height to prevent layout shift */}
          <span className="opacity-0">Loading date...</span>
        </h1>
      )}
    </div>
  );
}
