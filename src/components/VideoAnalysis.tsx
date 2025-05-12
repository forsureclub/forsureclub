
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, Share2 } from "lucide-react";
import { Progress } from "./ui/progress";
import { useAuth } from "@/hooks/useAuth";

export const VideoAnalysis = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shareCaption, setShareCaption] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string>("tennis");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.includes("video/")) {
      toast({
        title: "Invalid File",
        description: "Please upload a video file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Video must be less than 50MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload to Supabase Storage
      const fileName = `${user?.id}_${Date.now()}_${file.name}`;
      
      // Create a custom upload handler to track progress
      const xhr = new XMLHttpRequest();
      let uploadProgress = 0;
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          uploadProgress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(uploadProgress);
        }
      });
      
      // Use the upload method without the onUploadProgress option
      const { data, error } = await supabase.storage
        .from('sports_videos')
        .upload(fileName, file, {
          cacheControl: '3600'
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sports_videos')
        .getPublicUrl(data.path);

      setVideoUrl(publicUrl);

      // Trigger AI analysis
      await analyzeVideo(publicUrl, selectedSport);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeVideo = async (videoUrl: string, sport: string) => {
    setIsAnalyzing(true);
    try {
      // Call the Supabase Edge Function for AI analysis
      const { data, error } = await supabase.functions.invoke('analyze-sports-video', {
        body: { videoUrl, sport }
      });

      if (error) throw error;

      setFeedback(data.analysis);
      
      // Save to database using type assertion to work around the type issue temporarily
      // until Supabase types get updated
      await (supabase.from('player_videos') as any).insert({
        player_id: user?.id,
        video_url: videoUrl,
        sport: selectedSport,
        ai_feedback: data.analysis,
      });

      toast({
        title: "Analysis Complete",
        description: "AI has analyzed your video and provided feedback.",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze video",
        variant: "destructive",
      });
      setFeedback("Could not analyze the video at this time. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const shareToSocial = async () => {
    setIsSharing(true);
    try {
      // Call the Supabase Edge Function to share to social media
      const { data, error } = await supabase.functions.invoke('share-sports-video', {
        body: { 
          videoUrl, 
          caption: shareCaption || `Check out my ${selectedSport} skills! #ForSureClub #SportsTech`,
          platform: 'twitter' // Default to Twitter for now
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
    } finally {
      setIsSharing(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Video Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sport Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Select Sport</label>
          <select 
            value={selectedSport} 
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isUploading || isAnalyzing}
          >
            <option value="tennis">Tennis</option>
            <option value="golf">Golf</option>
            <option value="padel">Padel</option>
          </select>
        </div>

        {/* Upload Section */}
        <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg">
          <Input 
            ref={fileInputRef}
            type="file" 
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading || isAnalyzing}
          />
          
          {!videoUrl ? (
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-2">Upload a video of your sports performance</p>
              <Button onClick={triggerFileInput} disabled={isUploading || isAnalyzing}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading ({uploadProgress}%)
                  </>
                ) : (
                  "Select Video"
                )}
              </Button>
              {isUploading && <Progress value={uploadProgress} className="h-2 mt-2" />}
            </div>
          ) : (
            <div className="w-full space-y-4">
              <video 
                src={videoUrl} 
                controls 
                className="w-full rounded-md" 
                style={{ maxHeight: '300px' }}
              />
              
              <Button variant="outline" onClick={triggerFileInput} className="w-full">
                Upload Different Video
              </Button>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {isAnalyzing ? (
          <div className="text-center p-6">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2">Analyzing your technique with AI...</p>
          </div>
        ) : feedback && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">AI Analysis & Feedback</h3>
              <div className="p-4 bg-orange-50 rounded-md mt-2">
                <p className="whitespace-pre-line">{feedback}</p>
              </div>
            </div>

            {/* Social Media Sharing */}
            <div className="pt-4 border-t">
              <h3 className="font-medium text-lg mb-2 flex items-center">
                <Share2 className="mr-2 h-5 w-5" />
                Share to Social Media
              </h3>
              <Textarea
                value={shareCaption}
                onChange={(e) => setShareCaption(e.target.value)}
                placeholder={`Write a caption for your ${selectedSport} video!`}
                className="mb-2"
              />
              <Button onClick={shareToSocial} disabled={isSharing} className="w-full">
                {isSharing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  "Share to Twitter"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
