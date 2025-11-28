-- Add columns for background and alignment
-- Run this migration to add new fields to combatants table

ALTER TABLE combatants 
ADD COLUMN IF NOT EXISTS background VARCHAR(100),
ADD COLUMN IF NOT EXISTS alignment VARCHAR(50);

-- Update existing rows to have NULL values (optional fields)
-- No need to set defaults as these are optional

-- Analyze table to update statistics
ANALYZE combatants;
