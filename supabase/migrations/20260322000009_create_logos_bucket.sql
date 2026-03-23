-- Create logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload logos' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos');
  END IF;
END $$;

-- Allow authenticated users to update their logos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update logos' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can update logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'logos');
  END IF;
END $$;

-- Allow public read access to logos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for logos' AND tablename = 'objects') THEN
    CREATE POLICY "Public read access for logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'logos');
  END IF;
END $$;
