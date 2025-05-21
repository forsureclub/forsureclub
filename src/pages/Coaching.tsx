
import { useState } from "react";
import { VideoAnalysis } from "@/components/VideoAnalysis";
import { VideoHistory } from "@/components/VideoHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Video, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const Coaching = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const { user } = useAuth();

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Padel AI Coaching</h1>
        <p className="text-gray-600 mb-8">
          Upload short videos of your padel technique and receive AI-powered feedback from our virtual coach.
          Perfect your form and improve your game with personalized analysis.
        </p>

        <Card className="border-0 shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Video size={16} />
                <span>Upload Video</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History size={16} />
                <span>My Videos</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <VideoAnalysis />
            </TabsContent>
            
            <TabsContent value="history">
              <VideoHistory />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Coaching;
