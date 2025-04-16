
import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const sports = [
  "Basketball",
  "Volleyball",
  "Soccer",
  "Tennis Doubles",
  "Beach Volleyball",
  "Badminton Doubles"
];

export const SportSelector = ({ onSportSelect }: { onSportSelect: (sport: string) => void }) => {
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  const handleSportSelect = (sport: string) => {
    setSelectedSport(sport);
    onSportSelect(sport);
  };

  return (
    <Card className="p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Recommended Sports</h2>
      <div className="grid grid-cols-2 gap-4">
        {sports.map((sport) => (
          <Button
            key={sport}
            onClick={() => handleSportSelect(sport)}
            variant={selectedSport === sport ? "default" : "outline"}
            className="h-16 text-lg"
          >
            {sport}
          </Button>
        ))}
      </div>
    </Card>
  );
};
