-- Create storage bucket for comic covers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comic-covers',
  'comic-covers',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Policy: Users can view all comic covers (public bucket)
CREATE POLICY "Comic covers are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'comic-covers');

-- Policy: Authenticated users can upload covers
CREATE POLICY "Authenticated users can upload comic covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comic-covers' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own uploaded covers
CREATE POLICY "Users can update their own comic covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'comic-covers' 
  AND auth.uid() = owner::uuid
);

-- Policy: Users can delete their own uploaded covers
CREATE POLICY "Users can delete their own comic covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'comic-covers' 
  AND auth.uid() = owner::uuid
);