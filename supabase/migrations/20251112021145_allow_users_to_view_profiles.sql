-- Allow all authenticated users to view profile information
-- This is necessary for the invite feature to work properly

-- Add policy: all authenticated users can view all profiles
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Comments:
-- This policy allows authenticated users to view basic information (id, full_name, email, avatar_url, etc.)
-- This is necessary because:
-- 1. Invite feature needs to query organization member information
-- 2. Project member lists need to display member information
-- 3. Creator information needs to be shown on project cards
-- Sensitive information (if any) should be filtered at application layer, not RLS policy
