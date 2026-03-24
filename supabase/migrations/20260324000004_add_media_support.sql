-- Add attachments column to messages table for storing media metadata
ALTER TABLE messages ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- Create chat-media storage bucket for customer-sent images and audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-media bucket
CREATE POLICY "Public read access for chat media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-media');

CREATE POLICY "Service role can upload chat media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Service role can delete chat media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-media');
