-- Siege of Neverwinter Database Schema

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS plot_points CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS siege_notes CASCADE;
DROP TABLE IF EXISTS siege_state CASCADE;
DROP TABLE IF EXISTS combatant_conditions CASCADE;
DROP TABLE IF EXISTS monster_instances CASCADE;
DROP TABLE IF EXISTS monsters CASCADE;
DROP TABLE IF EXISTS combatants CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;

-- Campaigns table
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Combatants table (for PCs and NPCs)
CREATE TABLE combatants (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PC', 'NPC', 'Monster')),
    initiative INTEGER DEFAULT 0,
    ac INTEGER NOT NULL,
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    save_strength INTEGER DEFAULT 0,
    save_dexterity INTEGER DEFAULT 0,
    save_constitution INTEGER DEFAULT 0,
    save_intelligence INTEGER DEFAULT 0,
    save_wisdom INTEGER DEFAULT 0,
    save_charisma INTEGER DEFAULT 0,
    character_class VARCHAR(100),
    level INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Combatant conditions junction table
CREATE TABLE combatant_conditions (
    id SERIAL PRIMARY KEY,
    combatant_id INTEGER REFERENCES combatants(id) ON DELETE CASCADE,
    condition VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monsters table (template/database)
CREATE TABLE monsters (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    ac INTEGER NOT NULL,
    hp_formula VARCHAR(50),
    speed VARCHAR(100),
    stat_str INTEGER,
    stat_dex INTEGER,
    stat_con INTEGER,
    stat_int INTEGER,
    stat_wis INTEGER,
    stat_cha INTEGER,
    saves JSONB,
    skills JSONB,
    resistances TEXT[],
    immunities TEXT[],
    senses VARCHAR(255),
    languages VARCHAR(255),
    cr VARCHAR(20),
    attacks JSONB,
    abilities JSONB,
    lore TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monster instances table (combat-ready copies)
CREATE TABLE monster_instances (
    id SERIAL PRIMARY KEY,
    monster_id INTEGER REFERENCES monsters(id) ON DELETE CASCADE,
    combatant_id INTEGER REFERENCES combatants(id) ON DELETE CASCADE,
    instance_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Siege state table
CREATE TABLE siege_state (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    wall_integrity INTEGER DEFAULT 100 CHECK (wall_integrity >= 0 AND wall_integrity <= 100),
    defender_morale INTEGER DEFAULT 100 CHECK (defender_morale >= 0 AND defender_morale <= 100),
    supplies INTEGER DEFAULT 100 CHECK (supplies >= 0 AND supplies <= 100),
    day_of_siege INTEGER DEFAULT 1,
    custom_metrics JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Siege notes table
CREATE TABLE siege_notes (
    id SERIAL PRIMARY KEY,
    siege_state_id INTEGER REFERENCES siege_state(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'controlled' CHECK (status IN ('controlled', 'contested', 'enemy', 'destroyed')),
    description TEXT,
    coord_x INTEGER,
    coord_y INTEGER,
    coord_width INTEGER,
    coord_height INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plot points table
CREATE TABLE plot_points (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
    coord_x INTEGER,
    coord_y INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, preference_key)
);

-- Create indexes for performance
CREATE INDEX idx_combatants_campaign ON combatants(campaign_id);
CREATE INDEX idx_combatants_type ON combatants(type);
CREATE INDEX idx_combatants_initiative ON combatants(initiative DESC);
CREATE INDEX idx_combatant_conditions_combatant ON combatant_conditions(combatant_id);
CREATE INDEX idx_monsters_campaign ON monsters(campaign_id);
CREATE INDEX idx_monster_instances_monster ON monster_instances(monster_id);
CREATE INDEX idx_siege_state_campaign ON siege_state(campaign_id);
CREATE INDEX idx_locations_campaign ON locations(campaign_id);
CREATE INDEX idx_plot_points_location ON plot_points(location_id);

-- Insert default campaign
INSERT INTO campaigns (name) VALUES ('Default Campaign');
