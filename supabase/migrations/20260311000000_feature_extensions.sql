-- Feature extensions: vitrine, images, social proof actions, booking link
-- Stock items: image + show in vitrine
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS show_in_vitrine boolean DEFAULT false;

-- Raffles: image
ALTER TABLE public.raffles ADD COLUMN IF NOT EXISTS image_url text;

-- Social proofs: action type and booking link
ALTER TABLE public.social_proofs ADD COLUMN IF NOT EXISTS action_type text DEFAULT 'none';
ALTER TABLE public.social_proofs ADD COLUMN IF NOT EXISTS show_in_vitrine boolean DEFAULT false;
ALTER TABLE public.social_proofs ADD COLUMN IF NOT EXISTS booking_link text;

-- Barbershops: global booking link for automation
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS booking_link text;

-- Storage bucket for uploads (avatars, products, raffles)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload to uploads" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Public read uploads" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'uploads');

CREATE POLICY "Users update own uploads" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'uploads');

CREATE POLICY "Users delete own uploads" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'uploads');
