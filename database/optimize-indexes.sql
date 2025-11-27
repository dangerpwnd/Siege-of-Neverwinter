-- Additional indexes for performance optimization
-- Run this after initial schema setup

-- Composite index for combatants by campaign and initiative (for faster initiative queries)
CREATE INDEX IF NOT EXISTS idx_combatants_campaign_initiative 
ON combatants(campaign_id, initiative DESC);

-- Index for combatants by campaign and type (for filtering by type)
CREATE INDEX IF NOT EXISTS idx_combatants_campaign_type 
ON combatants(campaign_id, type);

-- Index for locations by campaign and status (for filtering by status)
CREATE INDEX IF NOT EXISTS idx_locations_campaign_status 
ON locations(campaign_id, status);

-- Index for plot points by status (for filtering active/completed)
CREATE INDEX IF NOT EXISTS idx_plot_points_status 
ON plot_points(status);

-- Index for siege notes by siege_state_id and timestamp (for chronological queries)
CREATE INDEX IF NOT EXISTS idx_siege_notes_state_time 
ON siege_notes(siege_state_id, created_at DESC);

-- Index for monster instances by combatant (for quick lookups)
CREATE INDEX IF NOT EXISTS idx_monster_instances_combatant 
ON monster_instances(combatant_id);

-- Partial index for active combatants (those in combat)
CREATE INDEX IF NOT EXISTS idx_combatants_active 
ON combatants(campaign_id, initiative DESC) 
WHERE current_hp > 0;

-- Index for user preferences by campaign (for quick preference lookups)
CREATE INDEX IF NOT EXISTS idx_preferences_campaign_key 
ON user_preferences(campaign_id, preference_key);

-- Add JSONB indexes for better performance on JSON queries
CREATE INDEX IF NOT EXISTS idx_monsters_attacks 
ON monsters USING GIN (attacks);

CREATE INDEX IF NOT EXISTS idx_monsters_abilities 
ON monsters USING GIN (abilities);

CREATE INDEX IF NOT EXISTS idx_siege_custom_metrics 
ON siege_state USING GIN (custom_metrics);

-- Analyze tables to update statistics for query planner
ANALYZE combatants;
ANALYZE monsters;
ANALYZE locations;
ANALYZE plot_points;
ANALYZE siege_state;
ANALYZE siege_notes;
ANALYZE user_preferences;
