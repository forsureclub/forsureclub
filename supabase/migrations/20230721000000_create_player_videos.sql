
-- Create table for player videos
CREATE TABLE IF NOT EXISTS public.player_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) NOT NULL,
  video_url TEXT NOT NULL,
  sport TEXT NOT NULL,
  ai_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at_timestamp_player_videos
BEFORE UPDATE ON public.player_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies
ALTER TABLE public.player_videos ENABLE ROW LEVEL SECURITY;

-- Users can view their own videos
CREATE POLICY "Users can view their own videos"
  ON public.player_videos
  FOR SELECT
  USING (auth.uid() = player_id::uuid);

-- Users can insert their own videos
CREATE POLICY "Users can insert their own videos"
  ON public.player_videos
  FOR INSERT
  WITH CHECK (auth.uid() = player_id::uuid);

-- Users can update their own videos
CREATE POLICY "Users can update their own videos"
  ON public.player_videos
  FOR UPDATE
  USING (auth.uid() = player_id::uuid);

-- Users can delete their own videos
CREATE POLICY "Users can delete their own videos"
  ON public.player_videos
  FOR DELETE
  USING (auth.uid() = player_id::uuid);

-- Create storage bucket for video uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('sports_videos', 'sports_videos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Videos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sports_videos');

CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sports_videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own videos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'sports_videos' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'sports_videos' AND auth.uid() = owner);
