-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload product images
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload product images' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
  END IF;
END $$;

-- Allow authenticated users to update their product images
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update product images' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Allow authenticated users to delete their product images
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete product images' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Allow public read access to product images
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for product images' AND tablename = 'objects') THEN
    CREATE POLICY "Public read access for product images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');
  END IF;
END $$;
