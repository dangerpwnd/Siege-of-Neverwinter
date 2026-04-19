import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Badge,
  Button,
  Divider,
  NumberInput,
  TextInput,
  ProgressBar,
  Tracker,
} from '@tremor/react';

interface CharacterCondition {
  id: number;
  condition: string;
  applied_at: string;
}

interface Character {
  id: number;
  name: string;
  character_class: string;
  level: number;
  ac: number;
  current_hp: number;
  max_hp: number;
  save_strength: number;
  save_dexterity: number;
  save_constitution: number;
  save_intelligence: number;
  save_wisdom: number;
  save_charisma: number;
  conditions: CharacterCondition[];
  race?: string;
  subclass?: string;
  background?: string;
  alignment?: string;
  notes?: string;
}

const DEFAULT_SAVES = {
  save_strength: 0,
  save_dexterity: 0,
  save_constitution: 0,
  save_intelligence: 0,
  save_wisdom: 0,
  save_charisma: 0,
};

function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

function getHPColor(current: number, max: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (max === 0) return 'red';
  const ratio = current / max;
  if (ratio > 0.5) return 'green';
  if (ratio > 0.25) return 'yellow';
  if (ratio > 0) return 'orange';
  return 'red';
}

export default function CharacterPanel() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    character_class: '',
    level: 1,
    ac: 10,
    max_hp: 10,
    ...DEFAULT_SAVES,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCharacter = characters.find((c) => c.id === selectedId) || null;

  // Load characters from API
  useEffect(() => {
    async function loadCharacters() {
      try {
        const response = await fetch('/api/characters?campaign_id=1');
        if (!response.ok) throw new Error('Failed to fetch characters');
        const data = await response.json();
        setCharacters(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load characters:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCharacters();
  }, []);

  // Update HP with debounced API call
  const updateHP = useCallback(
    (characterId: number, newHP: number) => {
      const character = characters.find((c) => c.id === characterId);
      if (!character) return;

      const clampedHP = Math.max(0, Math.min(newHP, character.max_hp));

      // Update locally immediately
      setCharacters((prev) =>
        prev.map((c) => (c.id === characterId ? { ...c, current_hp: clampedHP } : c))
      );

      // Debounce API call
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/characters/${characterId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_hp: clampedHP }),
          });
        } catch (error) {
          console.error('Failed to update HP:', error);
        }
      }, 500);
    },
    [characters]
  );

  // Create character
  const createCharacter = useCallback(async () => {
    if (!formData.name.trim()) return;
    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: 1,
          name: formData.name.trim(),
          character_class: formData.character_class,
          level: formData.level,
          ac: formData.ac,
          current_hp: formData.max_hp,
          max_hp: formData.max_hp,
          save_strength: formData.save_strength,
          save_dexterity: formData.save_dexterity,
          save_constitution: formData.save_constitution,
          save_intelligence: formData.save_intelligence,
          save_wisdom: formData.save_wisdom,
          save_charisma: formData.save_charisma,
        }),
      });
      if (!response.ok) throw new Error('Failed to create character');
      const newChar = await response.json();
      setCharacters((prev) => [...prev, newChar]);
      setSelectedId(newChar.id);
      setShowCreateForm(false);
      setFormData({ name: '', character_class: '', level: 1, ac: 10, max_hp: 10, ...DEFAULT_SAVES });
    } catch (error) {
      console.error('Failed to create character:', error);
    }
  }, [formData]);

  // Delete character
  const deleteCharacter = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/characters/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete character');
      setCharacters((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (error) {
      console.error('Failed to delete character:', error);
    }
  }, [selectedId]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading characters...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Character list */}
      <div className="flex flex-wrap gap-2">
        {characters.map((char) => (
          <Button
            key={char.id}
            size="xs"
            variant={selectedId === char.id ? 'primary' : 'secondary'}
            onClick={() => setSelectedId(char.id)}
            aria-label={`Select ${char.name}`}
          >
            {char.name}
          </Button>
        ))}
        <Button
          size="xs"
          variant="light"
          onClick={() => setShowCreateForm(!showCreateForm)}
          aria-label={showCreateForm ? 'Cancel creating character' : 'Create new character'}
        >
          {showCreateForm ? 'Cancel' : '+ New'}
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="border border-gray-200 rounded-md p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600" htmlFor="char-name">Name *</label>
              <TextInput
                id="char-name"
                placeholder="Character name"
                value={formData.name}
                onValueChange={(v) => setFormData((f) => ({ ...f, name: v }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600" htmlFor="char-class">Class</label>
              <TextInput
                id="char-class"
                placeholder="e.g. Fighter"
                value={formData.character_class}
                onValueChange={(v) => setFormData((f) => ({ ...f, character_class: v }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600" htmlFor="char-level">Level</label>
              <NumberInput
                id="char-level"
                value={formData.level}
                onValueChange={(v) => setFormData((f) => ({ ...f, level: v }))}
                min={1}
                max={20}
                enableStepper={false}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600" htmlFor="char-ac">AC</label>
              <NumberInput
                id="char-ac"
                value={formData.ac}
                onValueChange={(v) => setFormData((f) => ({ ...f, ac: v }))}
                enableStepper={false}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600" htmlFor="char-hp">Max HP</label>
              <NumberInput
                id="char-hp"
                value={formData.max_hp}
                onValueChange={(v) => setFormData((f) => ({ ...f, max_hp: v }))}
                enableStepper={false}
              />
            </div>
          </div>

          <Divider />

          <div className="text-xs text-gray-600 font-medium">Saving Throws</div>
          <div className="grid grid-cols-3 gap-2">
            {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((stat) => (
              <div key={stat}>
                <label className="text-xs text-gray-600" htmlFor={`char-save-${stat}`}>
                  {stat.slice(0, 3).toUpperCase()}
                </label>
                <NumberInput
                  id={`char-save-${stat}`}
                  value={formData[`save_${stat}` as keyof typeof formData] as number}
                  onValueChange={(v) => setFormData((f) => ({ ...f, [`save_${stat}`]: v }))}
                  enableStepper={false}
                />
              </div>
            ))}
          </div>

          <Button size="xs" onClick={createCharacter} aria-label="Create character">
            Create
          </Button>
        </div>
      )}

      {/* Selected character details */}
      {selectedCharacter && (
        <div className="space-y-3">
          <Divider />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm">{selectedCharacter.name}</span>
              {selectedCharacter.character_class && (
                <span className="text-xs text-gray-500 ml-2">
                  {selectedCharacter.character_class} {selectedCharacter.level}
                </span>
              )}
            </div>
            <Button
              size="xs"
              variant="secondary"
              color="red"
              onClick={() => deleteCharacter(selectedCharacter.id)}
              aria-label={`Delete ${selectedCharacter.name}`}
            >
              Delete
            </Button>
          </div>

          {/* Downed state indicator */}
          {selectedCharacter.current_hp === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2 text-center text-red-700 text-sm font-semibold">
              ⚠️ DOWN — 0 HP
            </div>
          )}

          {/* HP Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Hit Points</span>
              <span>{selectedCharacter.current_hp} / {selectedCharacter.max_hp}</span>
            </div>
            <ProgressBar
              value={selectedCharacter.max_hp > 0 ? (selectedCharacter.current_hp / selectedCharacter.max_hp) * 100 : 0}
              color={getHPColor(selectedCharacter.current_hp, selectedCharacter.max_hp)}
              tooltip={`${selectedCharacter.current_hp}/${selectedCharacter.max_hp} HP`}
            />
          </div>

          {/* HP Tracker visualization */}
          <Tracker
            data={Array.from({ length: 20 }, (_, i) => {
              const segmentHP = (selectedCharacter.max_hp / 20) * (i + 1);
              const isFilled = selectedCharacter.current_hp >= segmentHP;
              return {
                color: isFilled ? getHPColor(selectedCharacter.current_hp, selectedCharacter.max_hp) : 'gray',
                tooltip: `${Math.round(segmentHP)} HP`,
              };
            })}
          />

          {/* HP Controls */}
          <div className="flex items-center gap-2">
            <Button size="xs" variant="secondary" onClick={() => updateHP(selectedCharacter.id, selectedCharacter.current_hp - 5)} aria-label="Decrease HP by 5">-5</Button>
            <Button size="xs" variant="secondary" onClick={() => updateHP(selectedCharacter.id, selectedCharacter.current_hp - 1)} aria-label="Decrease HP by 1">-1</Button>
            <NumberInput
              value={selectedCharacter.current_hp}
              onValueChange={(v) => updateHP(selectedCharacter.id, v)}
              min={0}
              max={selectedCharacter.max_hp}
              enableStepper={false}
              className="w-20"
              aria-label={`Current HP for ${selectedCharacter.name}`}
            />
            <Button size="xs" variant="secondary" onClick={() => updateHP(selectedCharacter.id, selectedCharacter.current_hp + 1)} aria-label="Increase HP by 1">+1</Button>
            <Button size="xs" variant="secondary" onClick={() => updateHP(selectedCharacter.id, selectedCharacter.current_hp + 5)} aria-label="Increase HP by 5">+5</Button>
          </div>

          <Divider />

          {/* AC */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium">AC:</span>
            <span className="text-sm font-semibold">{selectedCharacter.ac}</span>
          </div>

          <Divider />

          {/* Saving Throws */}
          <div>
            <div className="text-xs text-gray-600 font-medium mb-2">Saving Throws</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {([
                ['STR', selectedCharacter.save_strength],
                ['DEX', selectedCharacter.save_dexterity],
                ['CON', selectedCharacter.save_constitution],
                ['INT', selectedCharacter.save_intelligence],
                ['WIS', selectedCharacter.save_wisdom],
                ['CHA', selectedCharacter.save_charisma],
              ] as const).map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded p-1">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-sm font-semibold">{formatModifier(value)}</div>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          {/* Conditions */}
          <div>
            <div className="text-xs text-gray-600 font-medium mb-2">Active Conditions</div>
            {selectedCharacter.conditions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedCharacter.conditions.map((cond) => (
                  <Badge key={cond.id} color="amber" size="xs">
                    {cond.condition}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-400">No active conditions</span>
            )}
          </div>
        </div>
      )}

      {!selectedCharacter && !showCreateForm && characters.length > 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          Select a character to view details.
        </div>
      )}

      {!showCreateForm && characters.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          No characters yet. Create one to get started.
        </div>
      )}
    </div>
  );
}
