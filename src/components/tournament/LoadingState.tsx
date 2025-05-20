
import React from "react";
import { Card } from "@/components/ui/card";

export const LoadingState = () => {
  return (
    <Card className="p-6">
      <div className="flex justify-center items-center h-48">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    </Card>
  );
};
