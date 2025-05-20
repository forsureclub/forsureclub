
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight } from "lucide-react";

interface BracketPlayer {
  id: string;
  name: string;
  eloRating: number;
  seed?: number;
}

interface BracketMatchProps {
  id: string;
  player1?: BracketPlayer | null;
  player2?: BracketPlayer | null;
  winner?: string | null;
  round: number;
  matchNumber: number;
  editable?: boolean;
  onSelectWinner: (matchId: string, playerId: string) => void;
}

export const BracketMatch = ({
  id,
  player1,
  player2,
  winner,
  editable = false,
  onSelectWinner
}: BracketMatchProps) => {
  const hasWinner = !!winner;

  return (
    <Card className={`p-2 border-2 ${hasWinner ? 'border-green-200' : ''}`}>
      <div className={`flex flex-col divide-y ${editable ? 'hover:bg-muted/50' : ''}`}>
        {/* Player 1 */}
        <div className={`flex justify-between items-center p-2 ${
          winner === player1?.id ? 'bg-green-50' : ''
        }`}>
          <div className="flex items-center gap-2">
            {player1 ? (
              <>
                {player1.seed && <span className="text-xs font-bold bg-primary/10 px-1 rounded">{player1.seed}</span>}
                <span>{player1.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({player1.eloRating})
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">TBD</span>
            )}
          </div>
          
          {editable && player1 && !hasWinner && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onSelectWinner(id, player1.id)}
              className="h-6 w-6 p-0"
            >
              <ArrowRight size={14} />
            </Button>
          )}
          
          {winner === player1?.id && (
            <Trophy className="h-4 w-4 text-green-600" />
          )}
        </div>
        
        {/* Player 2 */}
        <div className={`flex justify-between items-center p-2 ${
          winner === player2?.id ? 'bg-green-50' : ''
        }`}>
          <div className="flex items-center gap-2">
            {player2 ? (
              <>
                {player2.seed && <span className="text-xs font-bold bg-primary/10 px-1 rounded">{player2.seed}</span>}
                <span>{player2.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({player2.eloRating})
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">TBD</span>
            )}
          </div>
          
          {editable && player2 && !hasWinner && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onSelectWinner(id, player2.id)}
              className="h-6 w-6 p-0"
            >
              <ArrowRight size={14} />
            </Button>
          )}
          
          {winner === player2?.id && (
            <Trophy className="h-4 w-4 text-green-600" />
          )}
        </div>
      </div>
    </Card>
  );
};
