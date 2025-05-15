
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, Share2, Award } from "lucide-react";
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
  const [selectedSport, setSelectedSport] = useState<string>("padel");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0); // Track retry attempts
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast(); // Use the hook directly

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Clear previous states
    setErrorMessage(null);
    setFeedback(null);
    
    // Check file type
    if (!file.type.includes("video/")) {
      toast.error({
        title: "Invalid File",
        description: "Please upload a video file.",
      });
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error({
        title: "File Too Large",
        description: "Video must be less than 50MB.",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload to Supabase Storage
      const fileName = `${user?.id}_${Date.now()}_${file.name}`;
      
      // Create a custom upload handler to track progress
      let uploadProgress = 0;
      
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
      toast.success({
        title: "Upload Complete",
        description: "Video uploaded successfully. Starting analysis...",
      });

      // Trigger AI analysis
      await analyzeVideo(publicUrl, selectedSport);
    } catch (error: any) {
      console.error("Upload error:", error);
      setErrorMessage("Failed to upload video. Please try again.");
      toast.error({
        title: "Upload Failed",
        description: error.message || "Could not upload video",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeVideo = async (videoUrl: string, sport: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    
    try {
      // Call the Supabase Edge Function for AI analysis
      const { data, error } = await supabase.functions.invoke('analyze-sports-video', {
        body: { videoUrl, sport }
      });

      if (error) {
        console.error("Function error:", error);
        throw new Error(error.message || "Analysis function failed");
      }

      if (!data || !data.analysis) {
        throw new Error("No analysis was returned");
      }

      setFeedback(data.analysis);
      
      // Save to database
      const { error: dbError } = await supabase.from('player_videos').insert({
        player_id: user?.id,
        video_url: videoUrl,
        sport: selectedSport,
        ai_feedback: data.analysis,
      });

      if (dbError) {
        console.error("Database error:", dbError);
        // We still show the feedback even if saving to DB fails
      }

      toast.success({
        title: "Analysis Complete",
        description: "AI has analyzed your video and provided feedback.",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      setErrorMessage("Analysis failed. Please try again or contact support if the problem persists.");
      
      // Even when there's an error, check if we got a fallback analysis
      if (error.response && error.response.analysis) {
        setFeedback(error.response.analysis);
      } else {
        toast.error({
          title: "Analysis Failed",
          description: error.message || "Could not analyze video",
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retryAnalysis = async () => {
    if (!videoUrl) {
      toast.error({
        title: "No Video",
        description: "Please upload a video first",
      });
      return;
    }
    
    setFeedback(null);
    setErrorMessage(null);
    setRetryAttempt(prev => prev + 1); // Increment retry counter
    await analyzeVideo(videoUrl, selectedSport);
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

      toast.success({
        title: "Shared Successfully",
        description: "Your video has been shared to social media.",
      });
    } catch (error: any) {
      console.error("Sharing error:", error);
      toast.error({
        title: "Sharing Failed",
        description: error.message || "Could not share video",
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
            <option value="padel">Padel</option>
            <option value="tennis">Tennis</option>
            <option value="golf">Golf</option>
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
              <h3 className="font-medium text-lg flex items-center">
                <Award className="mr-2 h-5 w-5 text-orange-500" /> 
                AI Coach Feedback
              </h3>
              <div className="p-4 bg-orange-50 rounded-md mt-2">
                <div className="prose max-w-none whitespace-pre-line">
                  {feedback.split('##').map((section, i) => {
                    if (i === 0) return null; // Skip first empty part
                    
                    const [title, ...content] = section.split('\n');
                    return (
                      <div key={i} className="mb-4">
                        <h4 className="font-bold text-md mb-2">{title.trim()}</h4>
                        <div>{content.join('\n')}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {errorMessage && (
                <div className="mt-2">
                  <Button onClick={retryAnalysis} variant="secondary">
                    Retry Analysis
                  </Button>
                </div>
              )}
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
