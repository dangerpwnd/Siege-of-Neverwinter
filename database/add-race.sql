-- Add column for character race
-- Run this migration to add race field to combatants table

ALTER TABLE combatants 
ADD COLUMN IF NOT EXISTS race VARCHAR(100);

-- Analyze table to update statistics
ANALYZE combatants;
