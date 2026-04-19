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

interface NPCCondition {
  id: number;
  condition: string;
  applied_at: string;
}

interface NPC {
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
  conditions: NPCCondition[];
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

function getHPColor(current: number, max: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (max === 0) return 'red';
  const ratio = current / max;
  if (ratio > 0.5) return 'green';
  if (ratio > 0.25) return 'yellow';
  if (ratio > 0) return 'orange';
  return 'red';
}

export default function NPCPanel() {
  const [npcs, setNpcs] = useState<NPC[]>([]);
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

  const selectedNPC = npcs.find((n) => n.id === selectedId) || null;

  // Load NPCs from API
  useEffect(() => {
    async function loadNPCs() {
      try {
        const response = await fetch('/api/npcs?campaign_id=1');
        if (!response.ok) throw new Error('Failed to fetch NPCs');
        const data = await response.json();
        setNpcs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load NPCs:', error);
      } finally {
        setLoading(false);
      }
    }
    loadNPCs();
  }, []);

  // Update HP with debounced API call
  const updateHP = useCallback(
    (npcId: number, newHP: number) => {
      const npc = npcs.find((n) => n.id === npcId);
      if (!npc) return;

      const clampedHP = Math.max(0, Math.min(newHP, npc.max_hp));

      // Update locally immediately
      setNpcs((prev) =>
        prev.map((n) => (n.id === npcId ? { ...n, current_hp: clampedHP } : n))
      );

      // Debounce API call
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/npcs/${npcId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_hp: clampedHP }),
          });
        } catch (error) {
          console.error('Failed to update NPC HP:', error);
        }
      }, 500);
    },
    [npcs]
  );

  // Update NPC stat with debounced API call
  const updateStat = useCallback(
    (npcId: number, field: string, value: number | string) => {
      setNpcs((prev) =>
        prev.map((n) => (n.id === npcId ? { ...n, [field]: value } : n))
      );

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/npcs/${npcId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value }),
          });
        } catch (error) {
          console.error('Failed to update NPC stat:', error);
        }
      }, 500);
    },
    []
  );

  // Create NPC
  const createNPC = useCallback(async () => {
    if (!formData.name.trim()) return;
    try {
      const response = await fetch('/api/npcs', {
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
      if (!response.ok) throw new Error('Failed to create NPC');
      const newNPC = await response.json();
      setNpcs((prev) => [...prev, newNPC]);
      setSelectedId(newNPC.id);
      setShowCreateForm(false);
      setFormData({ name: '', character_class: '', level: 1, ac: 10, max_hp: 10, ...DEFAULT_SAVES });
    } catch (error) {
      console.error('Failed to create NPC:', error);
    }
  }, [formData]);

  // Delete NPC
  const deleteNPC = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/npcs/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete NPC');
      setNpcs((prev) => prev.filter((n) => n.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (error) {
      console.error('Failed to delete NPC:', error);
    }
  }, [selectedId]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading NPCs...</div>;
  }

  return (
    <div className="space-y-3">
      {/* NPC list */}
      <div className="flex flex-wrap gap-2">
        {npcs.map((npc) => (
          <Button
            key={npc.id}
            size="xs"
            variant={selectedId === npc.id ? 'primary' : 'secondary'}
            onClick={() => setSelectedId(npc.id)}
            aria-label={`Select ${npc.name}`}
          >
            {npc.name}
          </Button>
        ))}
        <Button
          size="xs"
          variant="light"
          onClick={() => setShowCreateForm(!showCreateForm)}
          aria-label={showCreateForm ? 'Cancel creating NPC' : 'Create new NPC'}
        >
          {showCreateForm ? 'Cancel' : '+ New'}
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="border border-gray-200 rounded-md p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600" htmlFor="npc-name">Name *</label>
              <TextInput
                id="npc-name"
                placeholder="NPC name"
                value={formData.name}
                onValueChange={(v) => setFormData((f) => ({ ...f, name: v }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600" htmlFor="npc-class">Class/Role</label>
              <TextInput
                id="npc-class"
                placeholder="e.g. Guard"
                value={formData.character_class}
                onValueChange={(v) => setFormData((f) => ({ ...f, character_class: v }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600" htmlFor="npc-level">Level</label>
              <NumberInput
                id="npc-level"
                value={formData.level}
                onValueChange={(v) => setFormData((f) => ({ ...f, level: v }))}
                min={1}
                max={20}
                enableStepper={false}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600" htmlFor="npc-ac">AC</label>
              <NumberInput
                id="npc-ac"
                value={formData.ac}
                onValueChange={(v) => setFormData((f) => ({ ...f, ac: v }))}
                enableStepper={false}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600" htmlFor="npc-hp">Max HP</label>
              <NumberInput
                id="npc-hp"
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
                <label className="text-xs text-gray-600" htmlFor={`npc-save-${stat}`}>
                  {stat.slice(0, 3).toUpperCase()}
                </label>
                <NumberInput
                  id={`npc-save-${stat}`}
                  value={formData[`save_${stat}` as keyof typeof formData] as number}
                  onValueChange={(v) => setFormData((f) => ({ ...f, [`save_${stat}`]: v }))}
                  enableStepper={false}
                />
              </div>
            ))}
          </div>

          <Button size="xs" onClick={createNPC} aria-label="Create NPC">
            Create
          </Button>
        </div>
      )}

      {/* Selected NPC details */}
      {selectedNPC && (
        <div className="space-y-3">
          <Divider />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm">{selectedNPC.name}</span>
              {selectedNPC.character_class && (
                <span className="text-xs text-gray-500 ml-2">
                  {selectedNPC.character_class} {selectedNPC.level}
                </span>
              )}
            </div>
            <Button
              size="xs"
              variant="secondary"
              color="red"
              onClick={() => deleteNPC(selectedNPC.id)}
              aria-label={`Delete ${selectedNPC.name}`}
            >
              Delete
            </Button>
          </div>

          {/* Downed state indicator */}
          {selectedNPC.current_hp === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2 text-center text-red-700 text-sm font-semibold">
              ⚠️ DOWN — 0 HP
            </div>
          )}

          {/* HP Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Hit Points</span>
              <span>{selectedNPC.current_hp} / {selectedNPC.max_hp}</span>
            </div>
            <ProgressBar
              value={selectedNPC.max_hp > 0 ? (selectedNPC.current_hp / selectedNPC.max_hp) * 100 : 0}
              color={getHPColor(selectedNPC.current_hp, selectedNPC.max_hp)}
              tooltip={`${selectedNPC.current_hp}/${selectedNPC.max_hp} HP`}
            />
          </div>

          {/* HP Tracker visualization */}
          <Tracker
            data={Array.from({ length: 20 }, (_, i) => {
              const segmentHP = (selectedNPC.max_hp / 20) * (i + 1);
              const isFilled = selectedNPC.current_hp >= segmentHP;
              return {
                color: isFilled ? getHPColor(selectedNPC.current_hp, selectedNPC.max_hp) : 'gray',
                tooltip: `${Math.round(segmentHP)} HP`,
              };
            })}
          />

          {/* HP Controls */}
          <div className="flex items-center gap-2">
            <Button size="xs" variant="secondary" onClick={() => updateHP(selectedNPC.id, selectedNPC.current_hp - 5)} aria-label="Decrease HP by 5">-5</Button>
            <Button size="xs" variant="secondary" onClick={() => updateHP(selectedNPC.id, selectedNPC.current_hp - 1)} aria-label="Decrease HP by 1">-1</Button>
            <NumberInput
              value={selectedNPC.current_hp}
              onValueChange={(v) => updateHP(selectedNPC.id, v)}
              min={0}
              max={selectedNPC.max_hp}
              enableStepper={false}
              className="w-20"
              aria-label={`Current HP for ${selectedNPC.name}`}
            />
            <Button size="xs" variant="secondary" onClick={() => updateHP(selectedNPC.id, selectedNPC.current_hp + 1)} aria-label="Increase HP by 1">+1</Button>
            <Button size="xs" variant="secondary" onClick={() => updateHP(selectedNPC.id, selectedNPC.current_hp + 5)} aria-label="Increase HP by 5">+5</Button>
          </div>

          <Divider />

          {/* AC - editable for NPCs */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium">AC:</span>
            <NumberInput
              value={selectedNPC.ac}
              onValueChange={(v) => updateStat(selectedNPC.id, 'ac', v)}
              enableStepper={false}
              className="w-16"
              aria-label={`Armor Class for ${selectedNPC.name}`}
            />
          </div>

          <Divider />

          {/* Saving Throws - editable for NPCs */}
          <div>
            <div className="text-xs text-gray-600 font-medium mb-2">Saving Throws</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {([
                ['STR', 'save_strength', selectedNPC.save_strength],
                ['DEX', 'save_dexterity', selectedNPC.save_dexterity],
                ['CON', 'save_constitution', selectedNPC.save_constitution],
                ['INT', 'save_intelligence', selectedNPC.save_intelligence],
                ['WIS', 'save_wisdom', selectedNPC.save_wisdom],
                ['CHA', 'save_charisma', selectedNPC.save_charisma],
              ] as const).map(([label, field, value]) => (
                <div key={label} className="bg-gray-50 rounded p-1">
                  <div className="text-xs text-gray-500">{label}</div>
                  <NumberInput
                    value={value}
                    onValueChange={(v) => updateStat(selectedNPC.id, field, v)}
                    enableStepper={false}
                    className="w-full text-center text-sm"
                    aria-label={`${label} save for ${selectedNPC.name}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <Divider />

          {/* Conditions */}
          <div>
            <div className="text-xs text-gray-600 font-medium mb-2">Active Conditions</div>
            {selectedNPC.conditions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedNPC.conditions.map((cond) => (
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

      {!selectedNPC && !showCreateForm && npcs.length > 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          Select an NPC to view details.
        </div>
      )}

      {!showCreateForm && npcs.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          No NPCs yet. Create one to get started.
        </div>
      )}
    </div>
  );
}
