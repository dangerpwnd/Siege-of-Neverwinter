-- Add columns for class/racial features and magical items
-- Run this migration to add new fields to combatants table

ALTER TABLE combatants 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS magical_items JSONB DEFAULT '[]';

-- Update existing rows to have empty arrays
UPDATE combatants 
SET features = '[]' 
WHERE features IS NULL;

UPDATE combatants 
SET magical_items = '[]' 
WHERE magical_items IS NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_combatants_features 
ON combatants USING GIN (features);

CREATE INDEX IF NOT EXISTS idx_combatants_items 
ON combatants USING GIN (magical_items);

-- Analyze table to update statistics
ANALYZE combatants;
