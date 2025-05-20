
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyBracketStateProps {
  editable: boolean;
  generating: boolean;
  onGenerate: () => void;
}

export const EmptyBracketState = ({ 
  editable, 
  generating, 
  onGenerate 
}: EmptyBracketStateProps) => {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-medium">No bracket available yet</h3>
        {editable && (
          <Button 
            onClick={onGenerate}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate 16-Player Bracket"}
          </Button>
        )}
      </div>
    </Card>
  );
};
