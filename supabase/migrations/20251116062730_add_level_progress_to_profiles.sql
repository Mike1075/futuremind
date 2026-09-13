-- Add level_progress field to profiles table
-- This field stores the progress percentage (0-100) within the current consciousness level
-- Used for the 5-stage tree growth system (seed/sprout/seedling/young/mature)

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS level_progress NUMERIC DEFAULT 0 CHECK (level_progress >= 0 AND level_progress <= 100);

-- Add comment to explain the field
COMMENT ON COLUMN profiles.level_progress IS 'Progress percentage (0-100) within current consciousness level for 5-stage tree growth';

-- Initialize level_progress from existing composite_score if it exists
UPDATE profiles
SET level_progress = COALESCE(
  CASE
    WHEN composite_score IS NOT NULL THEN
      LEAST(100, GREATEST(0, composite_score::numeric))
    ELSE 0
  END,
  0
)
WHERE level_progress IS NULL OR level_progress = 0;
