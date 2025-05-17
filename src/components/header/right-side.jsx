"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {  useViewStore } from "./../../../lib/store";
import Create from "../create";
import { View } from "lucide-react";
import ViewModeSelector from "../view-mode-selector";

export default function HeaderRight() {

  const { setView } = useViewStore();

  return (
    <div className="flex items-center space-x-4">
    {/* <SearchComponent /> */}
    <ViewModeSelector />

    <Create />

    {/* <Select onValueChange={(v) => setView(v)}>
      <SelectTrigger className="w-24 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0">
        <SelectValue placeholder="Day" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="day">Day</SelectItem>
        <SelectItem value="week">Week</SelectItem>
        <SelectItem value="month">Month</SelectItem>
      </SelectContent>
    </Select> */}

    {/* <Avatar>
      <AvatarImage src="/img/inst2.png" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar> */}
  </div>
  )
}
