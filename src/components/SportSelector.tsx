
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export const SportSelector = ({ onSportSelect }: { onSportSelect: (sport: string) => void }) => {
  // Always select "Padel" by default
  const handleSportSelect = () => {
    onSportSelect("Padel");
  };

  return (
    <Card className="p-6 bg-white shadow-lg rounded-xl">
      <div className="grid grid-cols-1 gap-6">
        <Button
          onClick={handleSportSelect}
          variant="default"
          className="h-32 text-xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105"
        >
          Padel
        </Button>
      </div>
    </Card>
  );
};
