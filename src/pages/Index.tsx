
import { useState } from "react"
import { Hero } from "../components/Hero"
import { SportSelector } from "../components/SportSelector"
import { MatchmakingCard } from "../components/MatchmakingCard"
import { Button } from "@/components/ui/button"

const Index = () => {
  const [isMatching, setIsMatching] = useState(false)
  const [selectedSport, setSelectedSport] = useState<string | null>(null)

  const handleBack = () => {
    if (selectedSport) {
      setSelectedSport(null)
    } else {
      setIsMatching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {!isMatching ? (
        <Hero onStartMatching={() => setIsMatching(true)} />
      ) : (
        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/af55ac11-46f4-41cd-9cdb-e68e3c019154.png" 
                  alt="For Sure Club" 
                  className="h-12 mr-4"
                />
                <h1 className="text-2xl font-bold text-gray-900">For Sure Club</h1>
              </div>
              
              <Button
                variant="outline"
                className="text-gray-700"
                onClick={handleBack}
              >
                {selectedSport ? "Back to Sports" : "Back to Home"}
              </Button>
            </header>

            {!selectedSport ? (
              <>
                <h2 className="text-3xl font-bold text-center mb-6">Select Your Sport</h2>
                <SportSelector onSportSelect={setSelectedSport} />
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-center mb-6">
                  Find Your {selectedSport} Match
                </h2>
                <MatchmakingCard selectedSport={selectedSport} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Index
