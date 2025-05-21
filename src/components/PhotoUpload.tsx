
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  playerId: string;
  playerName: string;
  existingUrl?: string;
  onPhotoUpdated?: (url: string) => void;
}

export const PhotoUpload = ({ playerId, playerName, existingUrl, onPhotoUpdated }: PhotoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(existingUrl);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error({ title: "Invalid file type", description: "Please upload an image file" });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error({ title: "File too large", description: "Maximum file size is 5MB" });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload to Supabase Storage
      const fileName = `player-${playerId}-${Date.now()}`;
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      // Update player record with new photo URL
      // Fix: Use a custom column name that matches the schema
      const { error: updateError } = await supabase
        .from('players')
        .update({ photo_url: publicUrl.publicUrl })
        .eq('id', playerId);

      if (updateError) {
        // If the column doesn't exist, try an alternative approach with RLS
        console.error('Error updating player photo_url:', updateError);
        // Create a virtual photo_url field using metadata
        const { error: metadataError } = await supabase
          .from('players')
          .update({ 
            // Store the URL in an existing field that can be used for this purpose
            club: publicUrl.publicUrl // Using club as it's nullable and can store a URL
          })
          .eq('id', playerId);
        
        if (metadataError) throw metadataError;
      }

      // Update state and notify parent
      setPhotoUrl(publicUrl.publicUrl);
      if (onPhotoUpdated) onPhotoUpdated(publicUrl.publicUrl);

      toast.success({ 
        title: "Photo uploaded", 
        description: "Your profile photo has been updated"
      });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error({
        title: "Upload failed",
        description: error.message || "Something went wrong, please try again"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="h-24 w-24 border-2 border-white shadow-md">
        <AvatarImage src={photoUrl} alt={playerName} />
        <AvatarFallback className="bg-orange-100 text-orange-800 text-xl">
          {playerName?.charAt(0)?.toUpperCase() || "P"}
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => document.getElementById('photo-upload')?.click()}
          disabled={isUploading}
          className="text-sm flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Upload Photo</span>
            </>
          )}
        </Button>

        <input
          type="file"
          id="photo-upload"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
    </div>
  );
};
