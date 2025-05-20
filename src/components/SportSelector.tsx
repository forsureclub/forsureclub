
import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export const SportSelector = ({ onSportSelect }: { onSportSelect: (sport: string) => void }) => {
  const [selectedSport, setSelectedSport] = useState<string | null>("Padel");

  const handleSportSelect = () => {
    setSelectedSport("Padel");
    onSportSelect("Padel");
  };

  return (
    <Card className="p-6 bg-white shadow-lg rounded-xl">
      <div className="grid grid-cols-1 gap-6">
        <Button
          onClick={handleSportSelect}
          variant={selectedSport === "Padel" ? "default" : "outline"}
          className="h-32 text-xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105"
        >
          Padel
        </Button>
      </div>
    </Card>
  );
};
