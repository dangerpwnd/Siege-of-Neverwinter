import { useState, useEffect, useCallback } from 'react';
import {
  Badge,
  Button,
  Divider,
  Legend,
  Select,
  SelectItem,
  TextInput,
} from '@tremor/react';

interface Location {
  id: number;
  name: string;
  status: 'controlled' | 'contested' | 'enemy' | 'destroyed';
  description: string;
  coordinates: { x: number; y: number; width: number; height: number };
  plot_points?: PlotPoint[];
}

interface PlotPoint {
  id: number;
  location_id: number;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  coordinates: { x: number; y: number };
}

const STATUS_COLORS: Record<string, string> = {
  controlled: '#22c55e',
  contested: '#eab308',
  enemy: '#ef4444',
  destroyed: '#6b7280',
};

const STATUS_FILL_OPACITY: Record<string, number> = {
  controlled: 0.3,
  contested: 0.3,
  enemy: 0.3,
  destroyed: 0.2,
};

const PLOT_STATUS_COLORS: Record<string, 'green' | 'blue' | 'red'> = {
  active: 'blue',
  completed: 'green',
  failed: 'red',
};

function CityMap() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [plotPoints, setPlotPoints] = useState<PlotPoint[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPlotPoint, setShowAddPlotPoint] = useState(false);
  const [newPlotName, setNewPlotName] = useState('');
  const [newPlotDescription, setNewPlotDescription] = useState('');

  // Load locations from API
  useEffect(() => {
    async function loadLocations() {
      try {
        const response = await fetch('/api/locations?campaign_id=1');
        if (!response.ok) throw new Error('Failed to fetch locations');
        const json = await response.json();
        setLocations(json.data || []);
      } catch (error) {
        console.error('Failed to load locations:', error);
      } finally {
        setLoading(false);
      }
    }
    loadLocations();
  }, []);

  // Load plot points from API
  useEffect(() => {
    async function loadPlotPoints() {
      try {
        const response = await fetch('/api/plotpoints?campaign_id=1');
        if (!response.ok) throw new Error('Failed to fetch plot points');
        const json = await response.json();
        setPlotPoints(json.data || []);
      } catch (error) {
        console.error('Failed to load plot points:', error);
      }
    }
    loadPlotPoints();
  }, []);

  // Update location status
  const updateLocationStatus = useCallback(async (locationId: number, status: string) => {
    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update location');
      setLocations((prev) =>
        prev.map((loc) => (loc.id === locationId ? { ...loc, status: status as Location['status'] } : loc))
      );
      if (selectedLocation?.id === locationId) {
        setSelectedLocation((prev) => (prev ? { ...prev, status: status as Location['status'] } : prev));
      }
    } catch (error) {
      console.error('Failed to update location status:', error);
    }
  }, [selectedLocation]);

  // Add plot point
  const addPlotPoint = useCallback(async (locationId: number) => {
    if (!newPlotName.trim()) return;
    try {
      const response = await fetch('/api/plotpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: locationId,
          name: newPlotName.trim(),
          description: newPlotDescription.trim() || null,
          status: 'active',
          campaign_id: 1,
        }),
      });
      if (!response.ok) throw new Error('Failed to add plot point');
      const json = await response.json();
      setPlotPoints((prev) => [...prev, json.data]);
      setNewPlotName('');
      setNewPlotDescription('');
      setShowAddPlotPoint(false);
    } catch (error) {
      console.error('Failed to add plot point:', error);
    }
  }, [newPlotName, newPlotDescription]);

  // Update plot point status
  const updatePlotPointStatus = useCallback(async (plotPointId: number, status: string) => {
    try {
      const response = await fetch(`/api/plotpoints/${plotPointId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update plot point');
      setPlotPoints((prev) =>
        prev.map((pp) => (pp.id === plotPointId ? { ...pp, status: status as PlotPoint['status'] } : pp))
      );
    } catch (error) {
      console.error('Failed to update plot point status:', error);
    }
  }, []);

  // Delete plot point
  const deletePlotPoint = useCallback(async (plotPointId: number) => {
    try {
      const response = await fetch(`/api/plotpoints/${plotPointId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete plot point');
      setPlotPoints((prev) => prev.filter((pp) => pp.id !== plotPointId));
    } catch (error) {
      console.error('Failed to delete plot point:', error);
    }
  }, []);

  // Handle location click on SVG
  const handleLocationClick = useCallback((location: Location) => {
    setSelectedLocation(location);
    setShowAddPlotPoint(false);
  }, []);

  // Get plot points for a specific location
  const getLocationPlotPoints = useCallback(
    (locationId: number) => plotPoints.filter((pp) => pp.location_id === locationId),
    [plotPoints]
  );

  if (loading) {
    return <div className="text-sm text-gray-500">Loading city map...</div>;
  }

  if (locations.length === 0) {
    return <div className="text-sm text-gray-500">No locations defined for this campaign.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Legend
        categories={['Controlled', 'Contested', 'Enemy', 'Destroyed']}
        colors={['green', 'yellow', 'red', 'gray']}
      />

      {/* SVG Map */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <svg
          viewBox="0 0 800 600"
          className="w-full h-auto"
          aria-label="Map of Neverwinter"
          role="img"
        >
          {/* Background */}
          <rect width="800" height="600" fill="#f8fafc" />

          {/* City outline */}
          <ellipse cx="400" cy="300" rx="350" ry="250" fill="none" stroke="#94a3b8" strokeWidth="2" />

          {/* Location regions */}
          {locations.map((location) => {
            const coords = location.coordinates || { x: 0, y: 0, width: 100, height: 80 };
            const isSelected = selectedLocation?.id === location.id;
            return (
              <g
                key={location.id}
                onClick={() => handleLocationClick(location)}
                className="cursor-pointer"
                role="button"
                aria-label={`${location.name} - ${location.status}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLocationClick(location);
                  }
                }}
              >
                <rect
                  x={coords.x}
                  y={coords.y}
                  width={coords.width}
                  height={coords.height}
                  fill={STATUS_COLORS[location.status]}
                  fillOpacity={STATUS_FILL_OPACITY[location.status]}
                  stroke={isSelected ? '#1e40af' : STATUS_COLORS[location.status]}
                  strokeWidth={isSelected ? 3 : 1.5}
                  rx="4"
                  ry="4"
                />
                <text
                  x={coords.x + coords.width / 2}
                  y={coords.y + coords.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium pointer-events-none"
                  fill="#1f2937"
                  fontSize="11"
                >
                  {location.name}
                </text>
              </g>
            );
          })}

          {/* Plot point markers */}
          {plotPoints
            .filter((pp) => pp.coordinates && pp.status === 'active')
            .map((pp) => (
              <circle
                key={pp.id}
                cx={pp.coordinates.x}
                cy={pp.coordinates.y}
                r="6"
                fill="#3b82f6"
                stroke="#fff"
                strokeWidth="2"
                aria-label={`Plot point: ${pp.name}`}
              />
            ))}
        </svg>
      </div>

      {/* Selected Location Details */}
      {selectedLocation && (
        <div className="space-y-3">
          <Divider />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">{selectedLocation.name}</span>
              <Badge color={
                selectedLocation.status === 'controlled' ? 'green' :
                selectedLocation.status === 'contested' ? 'yellow' :
                selectedLocation.status === 'enemy' ? 'red' : 'gray'
              }>
                {selectedLocation.status}
              </Badge>
            </div>
            <Button
              size="xs"
              variant="secondary"
              onClick={() => setSelectedLocation(null)}
              aria-label="Close location details"
            >
              ← Back
            </Button>
          </div>

          {selectedLocation.description && (
            <p className="text-sm text-gray-600">{selectedLocation.description}</p>
          )}

          {/* Status change */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Change Status:</span>
            <Select
              value={selectedLocation.status}
              onValueChange={(value) => updateLocationStatus(selectedLocation.id, value)}
              className="w-40"
              aria-label="Location status"
            >
              <SelectItem value="controlled">Controlled</SelectItem>
              <SelectItem value="contested">Contested</SelectItem>
              <SelectItem value="enemy">Enemy</SelectItem>
              <SelectItem value="destroyed">Destroyed</SelectItem>
            </Select>
          </div>

          <Divider />

          {/* Plot Points for this location */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Plot Points</span>
              <Button
                size="xs"
                onClick={() => setShowAddPlotPoint(!showAddPlotPoint)}
                aria-label="Add plot point"
              >
                + Add
              </Button>
            </div>

            {/* Add plot point form */}
            {showAddPlotPoint && (
              <div className="bg-gray-50 rounded p-2 space-y-2">
                <TextInput
                  placeholder="Plot point name"
                  value={newPlotName}
                  onValueChange={setNewPlotName}
                  aria-label="Plot point name"
                />
                <TextInput
                  placeholder="Description (optional)"
                  value={newPlotDescription}
                  onValueChange={setNewPlotDescription}
                  aria-label="Plot point description"
                />
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    onClick={() => addPlotPoint(selectedLocation.id)}
                    disabled={!newPlotName.trim()}
                    aria-label="Save plot point"
                  >
                    Save
                  </Button>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => {
                      setShowAddPlotPoint(false);
                      setNewPlotName('');
                      setNewPlotDescription('');
                    }}
                    aria-label="Cancel adding plot point"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Plot points list */}
            {getLocationPlotPoints(selectedLocation.id).length > 0 ? (
              <div className="space-y-2">
                {getLocationPlotPoints(selectedLocation.id).map((pp) => (
                  <div key={pp.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                    <div className="flex items-center gap-2">
                      <Badge color={PLOT_STATUS_COLORS[pp.status]} size="xs">
                        {pp.status}
                      </Badge>
                      <span className="text-sm">{pp.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select
                        value={pp.status}
                        onValueChange={(value) => updatePlotPointStatus(pp.id, value)}
                        className="w-28"
                        aria-label={`Status for ${pp.name}`}
                      >
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </Select>
                      <Button
                        size="xs"
                        variant="light"
                        color="red"
                        onClick={() => deletePlotPoint(pp.id)}
                        aria-label={`Delete ${pp.name}`}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No plot points at this location.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CityMap;
