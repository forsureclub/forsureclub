
import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

const timeSlots = [
  "06:00-09:00",
  "09:00-12:00",
  "12:00-15:00",
  "15:00-18:00",
  "18:00-21:00",
  "21:00-00:00"
];

interface DateTimeSelectorProps {
  selectedTimes: string[];
  onTimesChange: (times: string[]) => void;
}

export const DateTimeSelector = ({
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
