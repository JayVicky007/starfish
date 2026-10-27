-- Align local development schema with remote table modifications
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS media_type text;
-- Sync absolute column permissions across API layers
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON TABLE public.posts TO anon,
    authenticated,
    service_role;