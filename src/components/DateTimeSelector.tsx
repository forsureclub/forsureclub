
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "./ui/calendar";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const timeSlots = [
  "06:00-09:00",
  "09:00-12:00",
  "12:00-15:00",
  "15:00-18:00",
  "18:00-21:00",
  "21:00-00:00"
];

interface DateTimeSelectorProps {
  selectedDates: Date[];
  onDatesChange: (dates: Date[]) => void;
  selectedTimes: string[];
  onTimesChange: (times: string[]) => void;
}

export const DateTimeSelector = ({
  selectedDates,
  onDatesChange,
  selectedTimes,
  onTimesChange,
}: DateTimeSelectorProps) => {
  const toggleTimeSlot = (time: string) => {
    if (selectedTimes.includes(time)) {
      onTimesChange(selectedTimes.filter(t => t !== time));
    } else {
      onTimesChange([...selectedTimes, time]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Preferred Dates</Label>
        <div className="mt-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDates.length && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDates.length > 0 ? (
                  selectedDates.map(date => format(date, "PPP")).join(", ")
                ) : (
                  <span>Pick dates</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => onDatesChange(dates || [])}
                initialFocus
                className="pointer-events-auto"
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div>
        <Label>Preferred Times</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {timeSlots.map((time) => (
            <Button
              key={time}
              type="button"
              variant={selectedTimes.includes(time) ? "default" : "outline"}
              onClick={() => toggleTimeSlot(time)}
              className="w-full"
            >
              {time}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
