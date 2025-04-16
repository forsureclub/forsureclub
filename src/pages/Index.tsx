
import { useState } from "react";
import { Hero } from "../components/Hero";
import { SportSelector } from "../components/SportSelector";
import { MatchmakingCard } from "../components/MatchmakingCard";

const Index = () => {
  const [isMatching, setIsMatching] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  if (!isMatching) {
    return <Hero onStartMatching={() => setIsMatching(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {!selectedSport ? (
          <SportSelector onSportSelect={setSelectedSport} />
        ) : (
          <MatchmakingCard selectedSport={selectedSport} />
        )}
      </div>
    </div>
  );
};

export default Index;
