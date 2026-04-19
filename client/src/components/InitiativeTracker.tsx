import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Badge,
  Button,
  NumberInput,
  TextInput,
  Select,
  SelectItem,
} from '@tremor/react';

interface Combatant {
  id: string;
  name: string;
  type: 'PC' | 'NPC' | 'Monster';
  initiative: number;
  ac: number;
  currentHP: number;
  maxHP: number;
  saves: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  conditions: string[];
  notes: string;
}

const TYPE_COLORS: Record<Combatant['type'], 'green' | 'blue' | 'red'> = {
  PC: 'green',
  NPC: 'blue',
  Monster: 'red',
};

const DEFAULT_SAVES = {
  strength: 0,
  dexterity: 0,
  constitution: 0,
  intelligence: 0,
  wisdom: 0,
  charisma: 0,
};

export default function InitiativeTracker() {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInitiative, setNewInitiative] = useState<number>(0);
  const [newType, setNewType] = useState<Combatant['type']>('Monster');
  const [newAC, setNewAC] = useState<number>(10);
  const [newHP, setNewHP] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Sort combatants by initiative descending
  const sortedCombatants = [...combatants].sort((a, b) => b.initiative - a.initiative);

  // Load combatants from API
  useEffect(() => {
    async function loadCombatants() {
      try {
        const response = await fetch('/api/initiative?campaign_id=1');
        if (!response.ok) throw new Error('Failed to fetch initiative');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setCombatants(data.data);
        }
      } catch (error) {
        console.error('Failed to load initiative:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCombatants();
  }, []);

  // Add a combatant
  const addCombatant = useCallback(async () => {
    if (!newName.trim()) return;
    try {
      const response = await fetch('/api/initiative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          initiative: newInitiative,
          type: newType,
          ac: newAC,
          currentHP: newHP,
          maxHP: newHP,
          saves: DEFAULT_SAVES,
          conditions: [],
          campaign_id: 1,
        }),
      });
      if (!response.ok) throw new Error('Failed to add combatant');
      const data = await response.json();
      if (data.success && data.data) {
        setCombatants((prev) => [...prev, data.data]);
      }
      // Reset form
      setNewName('');
      setNewInitiative(0);
      setNewType('Monster');
      setNewAC(10);
      setNewHP(10);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add combatant:', error);
    }
  }, [newName, newInitiative, newType, newAC, newHP]);

  // Remove a combatant
  const removeCombatant = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/initiative/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to remove combatant');
      setCombatants((prev) => prev.filter((c) => c.id !== id));
      // Adjust turn index if needed
      setCurrentTurnIndex((prev) => {
        const newLength = combatants.length - 1;
        if (newLength === 0) return 0;
        return prev >= newLength ? 0 : prev;
      });
    } catch (error) {
      console.error('Failed to remove combatant:', error);
    }
  }, [combatants.length]);

  // Advance to next turn
  const nextTurn = useCallback(() => {
    if (sortedCombatants.length === 0) return;
    setCurrentTurnIndex((prev) => (prev + 1) % sortedCombatants.length);
  }, [sortedCombatants.length]);

  // Update initiative with debounced API call
  const updateInitiative = useCallback((id: string, newValue: number) => {
    // Update locally immediately
    setCombatants((prev) =>
      prev.map((c) => (c.id === id ? { ...c, initiative: newValue } : c))
    );

    // Debounce API call
    if (debounceRef.current[id]) {
      clearTimeout(debounceRef.current[id]);
    }
    debounceRef.current[id] = setTimeout(async () => {
      try {
        await fetch(`/api/initiative/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initiative: newValue }),
        });
      } catch (error) {
        console.error('Failed to update initiative:', error);
      }
    }, 500);
  }, []);

  // Get current active combatant
  const currentCombatant = sortedCombatants[currentTurnIndex] || null;

  if (loading) {
    return <div className="text-sm text-gray-500">Loading initiative tracker...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="xs"
          onClick={nextTurn}
          disabled={sortedCombatants.length === 0}
          aria-label="Next turn"
        >
          Next Turn
        </Button>
        <Button
          size="xs"
          variant="secondary"
          onClick={() => setShowAddForm(!showAddForm)}
          aria-label={showAddForm ? 'Cancel adding combatant' : 'Add combatant'}
        >
          {showAddForm ? 'Cancel' : 'Add Combatant'}
        </Button>
      </div>

      {/* Add combatant form */}
      {showAddForm && (
        <div className="border border-gray-200 rounded-md p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600" htmlFor="combatant-name">Name</label>
              <TextInput
                id="combatant-name"
                placeholder="Combatant name"
                value={newName}
                onValueChange={setNewName}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600" htmlFor="combatant-type">Type</label>
              <Select
                id="combatant-type"
                value={newType}
                onValueChange={(v) => setNewType(v as Combatant['type'])}
              >
                <SelectItem value="PC">PC</SelectItem>
                <SelectItem value="NPC">NPC</SelectItem>
                <SelectItem value="Monster">Monster</SelectItem>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-600" htmlFor="combatant-initiative">Initiative</label>
              <NumberInput
                id="combatant-initiative"
                value={newInitiative}
                onValueChange={setNewInitiative}
                enableStepper={false}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600" htmlFor="combatant-ac">AC</label>
              <NumberInput
                id="combatant-ac"
                value={newAC}
                onValueChange={setNewAC}
                enableStepper={false}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600" htmlFor="combatant-hp">HP</label>
              <NumberInput
                id="combatant-hp"
                value={newHP}
                onValueChange={setNewHP}
                enableStepper={false}
              />
            </div>
          </div>
          <Button size="xs" onClick={addCombatant} aria-label="Confirm add combatant">
            Add
          </Button>
        </div>
      )}

      {/* Combatant table */}
      {sortedCombatants.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-4">
          No combatants in initiative. Add one to get started.
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Initiative</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>AC</TableHeaderCell>
              <TableHeaderCell>HP</TableHeaderCell>
              <TableHeaderCell>Conditions</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCombatants.map((combatant, index) => {
              const isActive = index === currentTurnIndex;
              return (
                <TableRow
                  key={combatant.id}
                  className={isActive ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''}
                >
                  <TableCell>
                    <NumberInput
                      value={combatant.initiative}
                      onValueChange={(val) => updateInitiative(combatant.id, val)}
                      enableStepper={false}
                      className="w-16"
                      aria-label={`Initiative for ${combatant.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <span className={isActive ? 'font-bold' : ''}>
                      {combatant.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge color={TYPE_COLORS[combatant.type]}>
                      {combatant.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{combatant.ac}</TableCell>
                  <TableCell>
                    {combatant.currentHP}/{combatant.maxHP}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {combatant.conditions && combatant.conditions.length > 0 ? (
                        combatant.conditions.map((condition) => (
                          <Badge key={condition} color="amber" size="xs">
                            {condition}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="xs"
                      variant="secondary"
                      color="red"
                      onClick={() => removeCombatant(combatant.id)}
                      aria-label={`Remove ${combatant.name}`}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Current turn indicator */}
      {currentCombatant && (
        <div className="text-sm text-gray-600">
          Current turn: <span className="font-semibold">{currentCombatant.name}</span>
        </div>
      )}
    </div>
  );
}
