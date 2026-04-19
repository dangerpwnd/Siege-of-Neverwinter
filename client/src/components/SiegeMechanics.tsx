import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Badge,
  BarChart,
  Button,
  Divider,
  NumberInput,
  TextInput,
  Textarea,
  Tracker,
} from '@tremor/react';

interface SiegeNote {
  id: number;
  note_text: string;
  created_at: string;
}

interface SiegeState {
  id: number;
  wall_integrity: number;
  defender_morale: number;
  supplies: number;
  day_of_siege: number;
  custom_metrics: Record<string, number | string>;
  notes: SiegeNote[];
}

function getMetricColor(value: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (value > 66) return 'green';
  if (value > 33) return 'yellow';
  if (value > 10) return 'orange';
  return 'red';
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleString();
}

export default function SiegeMechanics() {
  const [siegeState, setSiegeState] = useState<SiegeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricValue, setNewMetricValue] = useState<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load siege state from API
  useEffect(() => {
    async function loadSiegeState() {
      try {
        const response = await fetch('/api/siege?campaign_id=1');
        if (!response.ok) throw new Error('Failed to fetch siege state');
        const json = await response.json();
        setSiegeState(json.data);
      } catch (error) {
        console.error('Failed to load siege state:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSiegeState();
  }, []);

  // Update a siege metric with debounced API call
  const updateMetric = useCallback(
    (key: 'wall_integrity' | 'defender_morale' | 'supplies' | 'day_of_siege', value: number) => {
      if (!siegeState) return;

      const clamped = key === 'day_of_siege' ? Math.max(1, value) : Math.max(0, Math.min(100, value));

      setSiegeState((prev) => (prev ? { ...prev, [key]: clamped } : prev));

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await fetch('/api/siege', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaign_id: 1, [key]: clamped }),
          });
        } catch (error) {
          console.error('Failed to update siege metric:', error);
        }
      }, 500);
    },
    [siegeState]
  );

  // Add a siege note
  const addNote = useCallback(async () => {
    if (!newNote.trim() || !siegeState) return;
    try {
      const response = await fetch('/api/siege/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: 1, note_text: newNote.trim() }),
      });
      if (!response.ok) throw new Error('Failed to add note');
      const json = await response.json();
      setSiegeState((prev) =>
        prev ? { ...prev, notes: [json.data, ...prev.notes] } : prev
      );
      setNewNote('');
    } catch (error) {
      console.error('Failed to add siege note:', error);
    }
  }, [newNote, siegeState]);

  // Delete a siege note
  const deleteNote = useCallback(async (noteId: number) => {
    try {
      const response = await fetch(`/api/siege/notes/${noteId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete note');
      setSiegeState((prev) =>
        prev ? { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) } : prev
      );
    } catch (error) {
      console.error('Failed to delete siege note:', error);
    }
  }, []);

  // Add custom metric
  const addCustomMetric = useCallback(async () => {
    if (!newMetricName.trim() || !siegeState) return;
    try {
      const response = await fetch('/api/siege/custom-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: 1,
          metric_name: newMetricName.trim(),
          metric_value: newMetricValue,
        }),
      });
      if (!response.ok) throw new Error('Failed to add custom metric');
      const json = await response.json();
      setSiegeState((prev) => (prev ? { ...prev, custom_metrics: json.data.custom_metrics } : prev));
      setNewMetricName('');
      setNewMetricValue(0);
    } catch (error) {
      console.error('Failed to add custom metric:', error);
    }
  }, [newMetricName, newMetricValue, siegeState]);

  // Remove custom metric
  const removeCustomMetric = useCallback(async (name: string) => {
    try {
      const response = await fetch(`/api/siege/custom-metrics/${encodeURIComponent(name)}?campaign_id=1`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove custom metric');
      const json = await response.json();
      setSiegeState((prev) => (prev ? { ...prev, custom_metrics: json.data.custom_metrics } : prev));
    } catch (error) {
      console.error('Failed to remove custom metric:', error);
    }
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading siege state...</div>;
  }

  if (!siegeState) {
    return <div className="text-sm text-gray-500">No siege data available.</div>;
  }

  // Prepare BarChart data
  const barChartData = [
    { metric: 'Wall Integrity', value: siegeState.wall_integrity },
    { metric: 'Morale', value: siegeState.defender_morale },
    { metric: 'Supplies', value: siegeState.supplies },
  ];

  return (
    <div className="space-y-4">
      {/* Day counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Day of Siege:</span>
          <Badge color="blue" size="lg">
            {siegeState.day_of_siege}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="xs"
            variant="secondary"
            onClick={() => updateMetric('day_of_siege', siegeState.day_of_siege - 1)}
            aria-label="Decrease day of siege"
          >
            -
          </Button>
          <NumberInput
            value={siegeState.day_of_siege}
            onValueChange={(v) => updateMetric('day_of_siege', v)}
            min={1}
            enableStepper={false}
            className="w-16"
            aria-label="Day of siege"
          />
          <Button
            size="xs"
            variant="secondary"
            onClick={() => updateMetric('day_of_siege', siegeState.day_of_siege + 1)}
            aria-label="Increase day of siege"
          >
            +
          </Button>
        </div>
      </div>

      <Divider />

      {/* BarChart visualization */}
      <div>
        <div className="text-xs text-gray-600 font-medium mb-2">Resource Levels</div>
        <BarChart
          data={barChartData}
          index="metric"
          categories={['value']}
          colors={['blue']}
          valueFormatter={(v) => `${v}%`}
          yAxisWidth={40}
          showLegend={false}
          aria-label="Siege resource levels bar chart"
        />
      </div>

      <Divider />

      {/* Tracker progress bars for each metric */}
      <div className="space-y-3">
        <div className="text-xs text-gray-600 font-medium">Metric Details</div>

        {/* Wall Integrity */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Wall Integrity</span>
            <span className="text-xs font-semibold">{siegeState.wall_integrity}%</span>
          </div>
          <Tracker
            data={Array.from({ length: 20 }, (_, i) => ({
              color: (i + 1) * 5 <= siegeState.wall_integrity
                ? getMetricColor(siegeState.wall_integrity)
                : 'gray',
              tooltip: `${(i + 1) * 5}%`,
            }))}
          />
          <NumberInput
            value={siegeState.wall_integrity}
            onValueChange={(v) => updateMetric('wall_integrity', v)}
            min={0}
            max={100}
            enableStepper={false}
            className="mt-1"
            aria-label="Wall integrity value"
          />
        </div>

        {/* Defender Morale */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Defender Morale</span>
            <span className="text-xs font-semibold">{siegeState.defender_morale}%</span>
          </div>
          <Tracker
            data={Array.from({ length: 20 }, (_, i) => ({
              color: (i + 1) * 5 <= siegeState.defender_morale
                ? getMetricColor(siegeState.defender_morale)
                : 'gray',
              tooltip: `${(i + 1) * 5}%`,
            }))}
          />
          <NumberInput
            value={siegeState.defender_morale}
            onValueChange={(v) => updateMetric('defender_morale', v)}
            min={0}
            max={100}
            enableStepper={false}
            className="mt-1"
            aria-label="Defender morale value"
          />
        </div>

        {/* Supplies */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Supplies</span>
            <span className="text-xs font-semibold">{siegeState.supplies}%</span>
          </div>
          <Tracker
            data={Array.from({ length: 20 }, (_, i) => ({
              color: (i + 1) * 5 <= siegeState.supplies
                ? getMetricColor(siegeState.supplies)
                : 'gray',
              tooltip: `${(i + 1) * 5}%`,
            }))}
          />
          <NumberInput
            value={siegeState.supplies}
            onValueChange={(v) => updateMetric('supplies', v)}
            min={0}
            max={100}
            enableStepper={false}
            className="mt-1"
            aria-label="Supplies value"
          />
        </div>
      </div>

      <Divider />

      {/* Custom Metrics */}
      <div className="space-y-2">
        <div className="text-xs text-gray-600 font-medium">Custom Metrics</div>
        {Object.entries(siegeState.custom_metrics || {}).map(([name, value]) => (
          <div key={name} className="flex items-center justify-between bg-gray-50 rounded p-2">
            <span className="text-sm">{name}</span>
            <div className="flex items-center gap-2">
              <Badge color="purple" size="xs">{String(value)}</Badge>
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={() => removeCustomMetric(name)}
                aria-label={`Remove ${name} metric`}
              >
                ×
              </Button>
            </div>
          </div>
        ))}

        {/* Add custom metric form */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-600" htmlFor="custom-metric-name">Name</label>
            <TextInput
              id="custom-metric-name"
              placeholder="Metric name"
              value={newMetricName}
              onValueChange={setNewMetricName}
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-gray-600" htmlFor="custom-metric-value">Value</label>
            <NumberInput
              id="custom-metric-value"
              value={newMetricValue}
              onValueChange={setNewMetricValue}
              enableStepper={false}
            />
          </div>
          <Button
            size="xs"
            onClick={addCustomMetric}
            disabled={!newMetricName.trim()}
            aria-label="Add custom metric"
          >
            Add
          </Button>
        </div>
      </div>

      <Divider />

      {/* Siege Notes */}
      <div className="space-y-2">
        <div className="text-xs text-gray-600 font-medium">Siege Notes</div>

        {/* Add note */}
        <Textarea
          placeholder="Add a siege note..."
          value={newNote}
          onValueChange={setNewNote}
          rows={3}
          aria-label="New siege note"
        />
        <Button
          size="xs"
          onClick={addNote}
          disabled={!newNote.trim()}
          aria-label="Add siege note"
        >
          Add Note
        </Button>

        {/* Notes list */}
        {siegeState.notes.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {siegeState.notes.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded p-2">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.note_text}</p>
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    onClick={() => deleteNote(note.id)}
                    aria-label={`Delete note from ${formatTimestamp(note.created_at)}`}
                  >
                    ×
                  </Button>
                </div>
                <span className="text-xs text-gray-400 mt-1 block">
                  {formatTimestamp(note.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No siege notes yet.</p>
        )}
      </div>
    </div>
  );
}
