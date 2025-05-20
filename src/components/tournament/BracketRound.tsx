
import React from "react";
import { BracketMatch } from "./BracketMatch";

interface BracketPlayer {
  id: string;
  name: string;
  eloRating: number;
  seed?: number;
}

interface BracketMatchData {
  id: string;
  player1?: BracketPlayer | null;
  player2?: BracketPlayer | null;
  winner?: string | null;
  nextMatchId?: string | null;
  round: number;
  matchNumber: number;
}

interface BracketRoundProps {
  round: number;
  roundName: string;
  matches: BracketMatchData[];
  editable?: boolean;
  onSelectWinner: (matchId: string, playerId: string) => void;
}

export const BracketRound = ({
  round,
  roundName,
  matches,
  editable = false,
  onSelectWinner
}: BracketRoundProps) => {
  const spacing = round > 1 ? `${2 ** round * 20}px` : '40px';
  
  return (
    <div 
      className="flex flex-col gap-4"
      style={{ 
        width: '240px',
        marginTop: round > 1 ? `${2 ** (round - 1) * 20}px` : '0' 
      }}
    >
      <h4 className="text-center font-medium">{roundName}</h4>
      
      <div className="flex flex-col gap-6">
        {matches.map((match) => (
          <div 
            key={match.id} 
            className="flex flex-col" 
            style={{ marginBottom: spacing }}
          >
            <BracketMatch
              id={match.id}
              player1={match.player1}
              player2={match.player2}
              winner={match.winner}
              round={match.round}
              matchNumber={match.matchNumber}
              editable={editable}
              onSelectWinner={onSelectWinner}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
