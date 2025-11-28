-- Create reference tables for D&D 5e character options
-- This allows for easier maintenance and custom additions

-- Races table
CREATE TABLE IF NOT EXISTS races (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    race_family VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subclasses table
CREATE TABLE IF NOT EXISTS subclasses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, class_id)
);

-- Backgrounds table
CREATE TABLE IF NOT EXISTS backgrounds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert races
INSERT INTO races (name, race_family) VALUES
    ('Dragonborn', 'Dragonborn'),
    ('Hill Dwarf', 'Dwarf'),
    ('Mountain Dwarf', 'Dwarf'),
    ('Duergar', 'Dwarf'),
    ('High Elf', 'Elf'),
    ('Wood Elf', 'Elf'),
    ('Dark Elf (Drow)', 'Elf'),
    ('Eladrin', 'Elf'),
    ('Sea Elf', 'Elf'),
    ('Shadar-kai', 'Elf'),
    ('Forest Gnome', 'Gnome'),
    ('Rock Gnome', 'Gnome'),
    ('Deep Gnome', 'Gnome'),
    ('Half-Elf', 'Half-Elf'),
    ('Half-Orc', 'Half-Orc'),
    ('Lightfoot Halfling', 'Halfling'),
    ('Stout Halfling', 'Halfling'),
    ('Ghostwise Halfling', 'Halfling'),
    ('Human', 'Human'),
    ('Variant Human', 'Human'),
    ('Tiefling', 'Tiefling'),
    ('Protector Aasimar', 'Aasimar'),
    ('Scourge Aasimar', 'Aasimar'),
    ('Fallen Aasimar', 'Aasimar'),
    ('Firbolg', 'Firbolg'),
    ('Air Genasi', 'Genasi'),
    ('Earth Genasi', 'Genasi'),
    ('Fire Genasi', 'Genasi'),
    ('Water Genasi', 'Genasi'),
    ('Goliath', 'Goliath'),
    ('Kenku', 'Kenku'),
    ('Lizardfolk', 'Lizardfolk'),
    ('Tabaxi', 'Tabaxi'),
    ('Triton', 'Triton')
ON CONFLICT (name) DO NOTHING;

-- Insert classes
INSERT INTO classes (name) VALUES
    ('Artificer'),
    ('Barbarian'),
    ('Bard'),
    ('Cleric'),
    ('Druid'),
    ('Fighter'),
    ('Monk'),
    ('Paladin'),
    ('Ranger'),
    ('Rogue'),
    ('Sorcerer'),
    ('Warlock'),
    ('Wizard')
ON CONFLICT (name) DO NOTHING;

-- Insert subclasses (using subqueries to get class_id)
INSERT INTO subclasses (name, class_id) VALUES
    -- Artificer
    ('Alchemist', (SELECT id FROM classes WHERE name = 'Artificer')),
    ('Armorer', (SELECT id FROM classes WHERE name = 'Artificer')),
    ('Artillerist', (SELECT id FROM classes WHERE name = 'Artificer')),
    ('Battle Smith', (SELECT id FROM classes WHERE name = 'Artificer')),
    -- Barbarian
    ('Path of the Berserker', (SELECT id FROM classes WHERE name = 'Barbarian')),
    ('Path of the Totem Warrior', (SELECT id FROM classes WHERE name = 'Barbarian')),
    ('Path of the Ancestral Guardian', (SELECT id FROM classes WHERE name = 'Barbarian')),
    ('Path of the Storm Herald', (SELECT id FROM classes WHERE name = 'Barbarian')),
    ('Path of the Zealot', (SELECT id FROM classes WHERE name = 'Barbarian')),
    ('Path of the Beast', (SELECT id FROM classes WHERE name = 'Barbarian')),
    ('Path of Wild Magic', (SELECT id FROM classes WHERE name = 'Barbarian')),
    -- Bard
    ('College of Lore', (SELECT id FROM classes WHERE name = 'Bard')),
    ('College of Valor', (SELECT id FROM classes WHERE name = 'Bard')),
    ('College of Glamour', (SELECT id FROM classes WHERE name = 'Bard')),
    ('College of Swords', (SELECT id FROM classes WHERE name = 'Bard')),
    ('College of Whispers', (SELECT id FROM classes WHERE name = 'Bard')),
    ('College of Creation', (SELECT id FROM classes WHERE name = 'Bard')),
    ('College of Eloquence', (SELECT id FROM classes WHERE name = 'Bard')),
    -- Cleric
    ('Knowledge Domain', (SELECT id FROM classes WHERE name = 'Cleric')),
    ('Life Domain', (SELECT id FROM classes WHERE name = 'Cleric')),
    ('Light Domain', (SELECT id FROM classes WHERE name = 'Cleric')),
    ('Nature Domain', (SELECT id FROM classes WHERE name = 'Cleric')),
    ('Tempest Domain', (SELECT id FROM classes WHERE name = 'Cleric')),
    ('Trickery Domain', (SELECT id FROM classes WHERE name = 'Cleric')),
    ('War Domain', (SELECT id FROM classes WHERE name = 'Cleric')),
    ('Death Domain', (SELECT id FROM classes WHERE name = 'Cleric')),
    ('Forge Domain', (SELECT id FROM classes WHERE name = 'Cleric')),
    ('Grave Domain', (SELECT id FROM classes WHERE name = 'Cleric')),
    ('Order Domain', (SELECT id FROM classes WHERE name = 'Cleric')),
    ('Peace Domain', (SELECT id FROM classes WHERE name = 'Cleric')),
    ('Twilight Domain', (SELECT id FROM classes WHERE name = 'Cleric')),
    -- Druid
    ('Circle of the Land', (SELECT id FROM classes WHERE name = 'Druid')),
    ('Circle of the Moon', (SELECT id FROM classes WHERE name = 'Druid')),
    ('Circle of Dreams', (SELECT id FROM classes WHERE name = 'Druid')),
    ('Circle of the Shepherd', (SELECT id FROM classes WHERE name = 'Druid')),
    ('Circle of Spores', (SELECT id FROM classes WHERE name = 'Druid')),
    ('Circle of Stars', (SELECT id FROM classes WHERE name = 'Druid')),
    ('Circle of Wildfire', (SELECT id FROM classes WHERE name = 'Druid')),
    -- Fighter
    ('Champion', (SELECT id FROM classes WHERE name = 'Fighter')),
    ('Battle Master', (SELECT id FROM classes WHERE name = 'Fighter')),
    ('Eldritch Knight', (SELECT id FROM classes WHERE name = 'Fighter')),
    ('Arcane Archer', (SELECT id FROM classes WHERE name = 'Fighter')),
    ('Cavalier', (SELECT id FROM classes WHERE name = 'Fighter')),
    ('Samurai', (SELECT id FROM classes WHERE name = 'Fighter')),
    ('Echo Knight', (SELECT id FROM classes WHERE name = 'Fighter')),
    ('Psi Warrior', (SELECT id FROM classes WHERE name = 'Fighter')),
    ('Rune Knight', (SELECT id FROM classes WHERE name = 'Fighter')),
    -- Monk
    ('Way of the Open Hand', (SELECT id FROM classes WHERE name = 'Monk')),
    ('Way of Shadow', (SELECT id FROM classes WHERE name = 'Monk')),
    ('Way of the Four Elements', (SELECT id FROM classes WHERE name = 'Monk')),
    ('Way of the Drunken Master', (SELECT id FROM classes WHERE name = 'Monk')),
    ('Way of the Kensei', (SELECT id FROM classes WHERE name = 'Monk')),
    ('Way of the Sun Soul', (SELECT id FROM classes WHERE name = 'Monk')),
    ('Way of Mercy', (SELECT id FROM classes WHERE name = 'Monk')),
    ('Way of the Astral Self', (SELECT id FROM classes WHERE name = 'Monk')),
    -- Paladin
    ('Oath of Devotion', (SELECT id FROM classes WHERE name = 'Paladin')),
    ('Oath of the Ancients', (SELECT id FROM classes WHERE name = 'Paladin')),
    ('Oath of Vengeance', (SELECT id FROM classes WHERE name = 'Paladin')),
    ('Oath of Conquest', (SELECT id FROM classes WHERE name = 'Paladin')),
    ('Oath of Redemption', (SELECT id FROM classes WHERE name = 'Paladin')),
    ('Oath of Glory', (SELECT id FROM classes WHERE name = 'Paladin')),
    ('Oath of the Watchers', (SELECT id FROM classes WHERE name = 'Paladin')),
    ('Oathbreaker', (SELECT id FROM classes WHERE name = 'Paladin')),
    -- Ranger
    ('Hunter', (SELECT id FROM classes WHERE name = 'Ranger')),
    ('Beast Master', (SELECT id FROM classes WHERE name = 'Ranger')),
    ('Gloom Stalker', (SELECT id FROM classes WHERE name = 'Ranger')),
    ('Horizon Walker', (SELECT id FROM classes WHERE name = 'Ranger')),
    ('Monster Slayer', (SELECT id FROM classes WHERE name = 'Ranger')),
    ('Fey Wanderer', (SELECT id FROM classes WHERE name = 'Ranger')),
    ('Swarmkeeper', (SELECT id FROM classes WHERE name = 'Ranger')),
    ('Drakewarden', (SELECT id FROM classes WHERE name = 'Ranger')),
    -- Rogue
    ('Thief', (SELECT id FROM classes WHERE name = 'Rogue')),
    ('Assassin', (SELECT id FROM classes WHERE name = 'Rogue')),
    ('Arcane Trickster', (SELECT id FROM classes WHERE name = 'Rogue')),
    ('Inquisitive', (SELECT id FROM classes WHERE name = 'Rogue')),
    ('Mastermind', (SELECT id FROM classes WHERE name = 'Rogue')),
    ('Scout', (SELECT id FROM classes WHERE name = 'Rogue')),
    ('Swashbuckler', (SELECT id FROM classes WHERE name = 'Rogue')),
    ('Phantom', (SELECT id FROM classes WHERE name = 'Rogue')),
    ('Soulknife', (SELECT id FROM classes WHERE name = 'Rogue')),
    -- Sorcerer
    ('Draconic Bloodline', (SELECT id FROM classes WHERE name = 'Sorcerer')),
    ('Wild Magic', (SELECT id FROM classes WHERE name = 'Sorcerer')),
    ('Divine Soul', (SELECT id FROM classes WHERE name = 'Sorcerer')),
    ('Shadow Magic', (SELECT id FROM classes WHERE name = 'Sorcerer')),
    ('Storm Sorcery', (SELECT id FROM classes WHERE name = 'Sorcerer')),
    ('Aberrant Mind', (SELECT id FROM classes WHERE name = 'Sorcerer')),
    ('Clockwork Soul', (SELECT id FROM classes WHERE name = 'Sorcerer')),
    -- Warlock
    ('The Archfey', (SELECT id FROM classes WHERE name = 'Warlock')),
    ('The Fiend', (SELECT id FROM classes WHERE name = 'Warlock')),
    ('The Great Old One', (SELECT id FROM classes WHERE name = 'Warlock')),
    ('The Celestial', (SELECT id FROM classes WHERE name = 'Warlock')),
    ('The Hexblade', (SELECT id FROM classes WHERE name = 'Warlock')),
    ('The Fathomless', (SELECT id FROM classes WHERE name = 'Warlock')),
    ('The Genie', (SELECT id FROM classes WHERE name = 'Warlock')),
    -- Wizard
    ('School of Abjuration', (SELECT id FROM classes WHERE name = 'Wizard')),
    ('School of Conjuration', (SELECT id FROM classes WHERE name = 'Wizard')),
    ('School of Divination', (SELECT id FROM classes WHERE name = 'Wizard')),
    ('School of Enchantment', (SELECT id FROM classes WHERE name = 'Wizard')),
    ('School of Evocation', (SELECT id FROM classes WHERE name = 'Wizard')),
    ('School of Illusion', (SELECT id FROM classes WHERE name = 'Wizard')),
    ('School of Necromancy', (SELECT id FROM classes WHERE name = 'Wizard')),
    ('School of Transmutation', (SELECT id FROM classes WHERE name = 'Wizard')),
    ('Bladesinging', (SELECT id FROM classes WHERE name = 'Wizard')),
    ('Order of Scribes', (SELECT id FROM classes WHERE name = 'Wizard'))
ON CONFLICT (name, class_id) DO NOTHING;

-- Insert backgrounds
INSERT INTO backgrounds (name) VALUES
    ('Acolyte'),
    ('Charlatan'),
    ('Criminal'),
    ('Entertainer'),
    ('Folk Hero'),
    ('Guild Artisan'),
    ('Hermit'),
    ('Noble'),
    ('Outlander'),
    ('Sage'),
    ('Sailor'),
    ('Soldier'),
    ('Urchin')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_races_family ON races(race_family);
CREATE INDEX IF NOT EXISTS idx_subclasses_class ON subclasses(class_id);

-- Analyze tables
ANALYZE races;
ANALYZE classes;
ANALYZE subclasses;
ANALYZE backgrounds;
