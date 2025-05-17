import { cn } from "./../../../lib/utils";
import React from "react";
import SideBarCalendar from "./side-bar-calendar";
import SearchUsers from "./search-users";
import MyCalendars from "./my-calendars";
import { useEventStore, useToggleSideBarStore } from "./../../../lib/store";
import TaskList from "./task-list";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SideBar() {
  const { isSideBarOpen } = useToggleSideBarStore();
  const router = useRouter();
  
  const handleLogout = () => {
    // Clear authentication token
    localStorage.removeItem("token");
    
    // Redirect to login page
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "w-120 hidden border-t px-2 py-3 transition-all duration-300 ease-in-out lg:block relative",
        !isSideBarOpen && "lg:hidden"
      )}
    >
      
      {/* <SideBarCalendar /> */}
      {/* <SearchUsers />
      <MyCalendars /> */}
      <TaskList />
      
      {/* Logout button with absolute positioning */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition-colors shadow-sm"
        >
          <LogOut className="h-4 w-4" /> 
          Logout
        </button>
      </div>
    </aside>
  );
}