-- =============================================================================
-- PHOTOFLOW — SUPABASE PRIVATE STORAGE & RLS POLICY SETUP
-- =============================================================================
-- Architecture:
--   PhotoFlow stores ZERO business records in normal Postgres tables.
--   All application datasets (clients, projects, tasks, payments, activities,
--   settings, and manifest) are encrypted client-side using Web Crypto AES-GCM
--   (256-bit random per-user DEK wrapped via PBKDF2-SHA256) BEFORE upload to
--   a private Supabase Storage bucket named `photoflow-data`.
--
-- Object Path Hierarchy:
--   photoflow-data/{userId}/key-bundle.json
--   photoflow-data/{userId}/manifest.enc
--   photoflow-data/{userId}/clients.enc
--   photoflow-data/{userId}/projects.enc
--   photoflow-data/{userId}/tasks.enc
--   photoflow-data/{userId}/payments.enc
--   photoflow-data/{userId}/activities.enc
--   photoflow-data/{userId}/settings.enc
--   photoflow-data/{userId}/snapshots/{dataset}/v-{version}.enc
-- =============================================================================

-- 1. Create the private Storage bucket `photoflow-data`
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photoflow-data',
  'photoflow-data',
  false, -- Strictly PRIVATE bucket (never public)
  52428800, -- 50 MB per encrypted object limit
  ARRAY['application/octet-stream', 'application/json', 'text/plain']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing PhotoFlow policies if re-running script
DROP POLICY IF EXISTS "photoflow_users_select_own_objects" ON storage.objects;
DROP POLICY IF EXISTS "photoflow_users_insert_own_objects" ON storage.objects;
DROP POLICY IF EXISTS "photoflow_users_update_own_objects" ON storage.objects;
DROP POLICY IF EXISTS "photoflow_users_delete_own_objects" ON storage.objects;

-- 3. Strict Per-User Row Level Security (RLS) Policies on `storage.objects`
-- Every authenticated user can ONLY read/create/update/delete objects inside
-- their own `{auth.uid()}/...` folder inside the `photoflow-data` bucket.

CREATE POLICY "photoflow_users_select_own_objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'photoflow-data'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
);

CREATE POLICY "photoflow_users_insert_own_objects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photoflow-data'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
);

CREATE POLICY "photoflow_users_update_own_objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photoflow-data'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
)
WITH CHECK (
  bucket_id = 'photoflow-data'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
);

CREATE POLICY "photoflow_users_delete_own_objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'photoflow-data'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
);
