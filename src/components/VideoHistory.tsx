
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Share2, Calendar, Award } from "lucide-react";

export const VideoHistory = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user]);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      
      // Use type assertion to work around the type issue temporarily
      // until Supabase types get updated
      const { data, error } = await (supabase
        .from('player_videos') as any)
        .select('*')
        .eq('player_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      toast({
        title: "Error",
        description: "Failed to load video history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const shareVideo = async (videoUrl: string, sport: string) => {
    try {
      // Call the Supabase Edge Function to share to social media
      const caption = `Check out my ${sport} skills! #ForSureClub #SportsTech`;
      
      const { data, error } = await supabase.functions.invoke('share-sports-video', {
        body: { 
          videoUrl, 
          caption,
          platform: 'twitter'
        }
      });

      if (error) throw error;

      toast({
        title: "Shared Successfully",
        description: "Your video has been shared to social media.",
      });
    } catch (error: any) {
      console.error("Sharing error:", error);
      toast({
        title: "Sharing Failed",
        description: error.message || "Could not share video",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading your videos...</div>;
  }

  if (videos.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            You haven't uploaded any videos yet. Start uploading to get AI feedback!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Videos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {videos.map((video) => (
            <div key={video.id} className="border rounded-md p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-lg">{video.sport} Video</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(video.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => shareVideo(video.video_url, video.sport)}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>
              
              <video 
                src={video.video_url} 
                controls 
                className="w-full rounded-md my-2" 
                style={{ maxHeight: '200px' }}
              />
              
              <div className="mt-2">
                <div className="flex items-center mb-1">
                  <Award className="h-4 w-4 text-orange-500 mr-2" />
                  <h4 className="font-medium">AI Feedback</h4>
                </div>
                <p className="text-sm bg-orange-50 p-3 rounded-md">{video.ai_feedback}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
