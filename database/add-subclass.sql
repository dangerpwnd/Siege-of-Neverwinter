-- Add column for character subclass
-- Run this migration to add subclass field to combatants table

ALTER TABLE combatants 
ADD COLUMN IF NOT EXISTS subclass VARCHAR(100);

-- Analyze table to update statistics
ANALYZE combatants;
