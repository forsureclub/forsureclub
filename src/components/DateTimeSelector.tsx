
import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const timeSlots = [
  "06:00-09:00",
  "09:00-12:00",
  "12:00-15:00",
  "15:00-18:00",
  "18:00-21:00",
  "21:00-00:00"
];

interface DateTimeSelectorProps {
  selectedDays: 'weekdays' | 'weekends' | 'both';
  onDaysChange: (days: 'weekdays' | 'weekends' | 'both') => void;
  selectedTimes: string[];
  onTimesChange: (times: string[]) => void;
}

export const DateTimeSelector = ({
  selectedDays,
  onDaysChange,
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
        <Label>Preferred Days</Label>
        <RadioGroup
          value={selectedDays}
          onValueChange={(value) => onDaysChange(value as 'weekdays' | 'weekends' | 'both')}
          className="mt-2 flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="weekdays" id="weekdays" />
            <Label htmlFor="weekdays" className="cursor-pointer">Weekdays (Monday-Friday)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="weekends" id="weekends" />
            <Label htmlFor="weekends" className="cursor-pointer">Weekends (Saturday-Sunday)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="both" id="both" />
            <Label htmlFor="both" className="cursor-pointer">Both weekdays and weekends</Label>
          </div>
        </RadioGroup>
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
