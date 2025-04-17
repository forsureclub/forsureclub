
import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Table, Golf } from "lucide-react";

const sports = [
  "Padel",
  "Golf"
];

const sportIcons = {
  "Padel": Table,
  "Golf": Golf
};

export const SportSelector = ({ onSportSelect }: { onSportSelect: (sport: string) => void }) => {
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  const handleSportSelect = (sport: string) => {
    setSelectedSport(sport);
    onSportSelect(sport);
  };

  return (
    <Card className="p-6 bg-white shadow-lg rounded-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sports.map((sport) => {
          const Icon = sportIcons[sport as keyof typeof sportIcons];
          return (
            <Button
              key={sport}
              onClick={() => handleSportSelect(sport)}
              variant={selectedSport === sport ? "default" : "outline"}
              className="h-32 text-xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105"
            >
              <Icon className="h-10 w-10" />
              {sport}
            </Button>
          );
        })}
      </div>
    </Card>
  );
};
