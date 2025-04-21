
import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const sports = [
  "Padel",
  "Golf",
  "Tennis"
];

export const SportSelector = ({ onSportSelect }: { onSportSelect: (sport: string) => void }) => {
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  const handleSportSelect = (sport: string) => {
    setSelectedSport(sport);
    onSportSelect(sport);
  };

  return (
    <Card className="p-6 bg-white shadow-lg rounded-xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sports.map((sport) => (
          <Button
            key={sport}
            onClick={() => handleSportSelect(sport)}
            variant={selectedSport === sport ? "default" : "outline"}
            className="h-32 text-xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105"
          >
            {sport}
          </Button>
        ))}
      </div>
    </Card>
  );
};
