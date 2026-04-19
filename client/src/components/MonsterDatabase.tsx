import { useState, useEffect, useCallback } from 'react';
import {
  Badge,
  Button,
  SearchSelect,
  SearchSelectItem,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Divider,
} from '@tremor/react';
import {
  Dialog,
  DialogPanel,
} from '@headlessui/react';

interface MonsterAttack {
  name: string;
  bonus: number;
  damage: string;
  type: string;
  description: string;
}

interface MonsterAbility {
  name: string;
  description: string;
}

interface Monster {
  id: number;
  name: string;
  ac: number;
  hp_formula: string;
  speed: string;
  stat_str: number;
  stat_dex: number;
  stat_con: number;
  stat_int: number;
  stat_wis: number;
  stat_cha: number;
  saves: Record<string, number>;
  skills: Record<string, number>;
  resistances: string[];
  immunities: string[];
  senses: string;
  languages: string;
  cr: string;
  attacks: MonsterAttack[];
  abilities: MonsterAbility[];
  lore: string;
}

export default function MonsterDatabase() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState<string>('');
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load monsters from API
  useEffect(() => {
    async function loadMonsters() {
      try {
        const response = await fetch('/api/monsters?campaign_id=1');
        if (!response.ok) throw new Error('Failed to fetch monsters');
        const json = await response.json();
        setMonsters(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        console.error('Failed to load monsters:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMonsters();
  }, []);

  // Filter monsters by name
  const filteredMonsters = filterName
    ? monsters.filter((m) => m.id.toString() === filterName)
    : monsters;

  // Open stat block dialog
  const openStatBlock = useCallback((monster: Monster) => {
    setSelectedMonster(monster);
    setDialogOpen(true);
  }, []);

  // Add monster to encounter (create instance)
  const addToEncounter = useCallback(async (monster: Monster) => {
    try {
      const instanceCount = monsters.filter((m) => m.name === monster.name).length;
      const instanceName = `${monster.name} #${instanceCount + 1}`;

      const response = await fetch(`/api/monsters/${monster.id}/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_name: instanceName }),
      });

      if (!response.ok) throw new Error('Failed to create monster instance');
      // Instance created successfully — it will appear in the initiative tracker
    } catch (error) {
      console.error('Failed to add monster to encounter:', error);
    }
  }, [monsters]);

  // Calculate ability modifier
  const calcMod = (stat: number) => {
    const mod = Math.floor((stat - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading monsters...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Search/Filter */}
      <SearchSelect
        placeholder="Filter monsters by name..."
        value={filterName}
        onValueChange={setFilterName}
        aria-label="Filter monsters"
      >
        {monsters.map((m) => (
          <SearchSelectItem key={m.id} value={m.id.toString()}>
            {m.name} (CR {m.cr})
          </SearchSelectItem>
        ))}
      </SearchSelect>

      {/* Monster Table */}
      <Table aria-label="Monster database list">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>CR</TableHeaderCell>
            <TableHeaderCell>AC</TableHeaderCell>
            <TableHeaderCell>HP</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredMonsters.map((monster) => (
            <TableRow
              key={monster.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => openStatBlock(monster)}
            >
              <TableCell>
                <span className="font-medium">{monster.name}</span>
              </TableCell>
              <TableCell>
                <Badge color="blue" size="xs">{monster.cr}</Badge>
              </TableCell>
              <TableCell>{monster.ac}</TableCell>
              <TableCell>{monster.hp_formula || '—'}</TableCell>
              <TableCell>
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToEncounter(monster);
                  }}
                  aria-label={`Add ${monster.name} to encounter`}
                >
                  Add to Encounter
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {filteredMonsters.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <span className="text-sm text-gray-500">No monsters found.</span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Stat Block Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            {selectedMonster && (
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">{selectedMonster.name}</h2>
                  <Badge color="blue">CR {selectedMonster.cr}</Badge>
                </div>

                <Divider />

                {/* Core Stats */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><span className="font-medium">AC:</span> {selectedMonster.ac}</div>
                  <div><span className="font-medium">HP:</span> {selectedMonster.hp_formula || '—'}</div>
                  <div><span className="font-medium">Speed:</span> {selectedMonster.speed || '—'}</div>
                </div>

                <Divider />

                {/* Ability Scores */}
                <div className="grid grid-cols-6 gap-1 text-center text-xs">
                  {([
                    ['STR', selectedMonster.stat_str],
                    ['DEX', selectedMonster.stat_dex],
                    ['CON', selectedMonster.stat_con],
                    ['INT', selectedMonster.stat_int],
                    ['WIS', selectedMonster.stat_wis],
                    ['CHA', selectedMonster.stat_cha],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="bg-gray-50 rounded p-2">
                      <div className="font-medium text-gray-600">{label}</div>
                      <div className="text-sm font-bold">{value}</div>
                      <div className="text-gray-500">({calcMod(value)})</div>
                    </div>
                  ))}
                </div>

                {/* Saves */}
                {selectedMonster.saves && Object.keys(selectedMonster.saves).length > 0 && (
                  <>
                    <Divider />
                    <div className="text-sm">
                      <span className="font-medium">Saving Throws: </span>
                      {Object.entries(selectedMonster.saves).map(([key, val]) => (
                        `${key.slice(0, 3).toUpperCase()} +${val}`
                      )).join(', ')}
                    </div>
                  </>
                )}

                {/* Skills */}
                {selectedMonster.skills && Object.keys(selectedMonster.skills).length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Skills: </span>
                    {Object.entries(selectedMonster.skills).map(([key, val]) => (
                      `${key} +${val}`
                    )).join(', ')}
                  </div>
                )}

                {/* Resistances & Immunities */}
                {selectedMonster.resistances && selectedMonster.resistances.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Resistances: </span>
                    {selectedMonster.resistances.join(', ')}
                  </div>
                )}
                {selectedMonster.immunities && selectedMonster.immunities.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Immunities: </span>
                    {selectedMonster.immunities.join(', ')}
                  </div>
                )}

                {/* Senses & Languages */}
                {selectedMonster.senses && (
                  <div className="text-sm">
                    <span className="font-medium">Senses: </span>{selectedMonster.senses}
                  </div>
                )}
                {selectedMonster.languages && (
                  <div className="text-sm">
                    <span className="font-medium">Languages: </span>{selectedMonster.languages}
                  </div>
                )}

                {/* Abilities */}
                {selectedMonster.abilities && selectedMonster.abilities.length > 0 && (
                  <>
                    <Divider />
                    <div className="text-sm font-medium">Abilities</div>
                    {selectedMonster.abilities.map((ability, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium italic">{ability.name}. </span>
                        {ability.description}
                      </div>
                    ))}
                  </>
                )}

                {/* Attacks */}
                {selectedMonster.attacks && selectedMonster.attacks.length > 0 && (
                  <>
                    <Divider />
                    <div className="text-sm font-medium">Attacks</div>
                    {selectedMonster.attacks.map((attack, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium italic">{attack.name}. </span>
                        +{attack.bonus} to hit, {attack.damage} {attack.type} damage.
                        {attack.description && ` ${attack.description}`}
                      </div>
                    ))}
                  </>
                )}

                {/* Lore */}
                {selectedMonster.lore && (
                  <>
                    <Divider />
                    <div className="text-sm font-medium">Lore</div>
                    <div className="text-sm text-gray-600 italic">{selectedMonster.lore}</div>
                  </>
                )}

                <Divider />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    onClick={() => {
                      addToEncounter(selectedMonster);
                      setDialogOpen(false);
                    }}
                    aria-label={`Add ${selectedMonster.name} to encounter`}
                  >
                    Add to Encounter
                  </Button>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => setDialogOpen(false)}
                    aria-label="Close stat block"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
