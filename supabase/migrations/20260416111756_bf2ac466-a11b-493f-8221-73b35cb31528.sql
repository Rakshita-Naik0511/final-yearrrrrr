-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true);

-- Allow anyone to upload resumes
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes');

-- Allow anyone to read resumes
CREATE POLICY "Anyone can read resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes');

-- Allow anyone to delete resumes
CREATE POLICY "Anyone can delete resumes"
ON storage.objects FOR DELETE
USING (bucket_id = 'resumes');