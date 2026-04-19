import { useState, useEffect, useCallback, useRef, type DragEvent, type ReactNode } from 'react';
import { Card, Title, Select, SelectItem, Button } from '@tremor/react';
import type { LayoutConfiguration, ModuleId } from '../types/layout';
import { MODULE_IDS } from '../types/layout';

export type ModuleVisibility = Record<ModuleId, boolean>;

const DEFAULT_VISIBILITY: ModuleVisibility = MODULE_IDS.reduce(
  (acc, id) => ({ ...acc, [id]: true }),
  {} as ModuleVisibility
);

async function fetchModuleVisibility(): Promise<ModuleVisibility> {
  const response = await fetch('/api/preferences?campaign_id=1');
  if (!response.ok) throw new Error('Failed to fetch preferences');
  const data = await response.json();
  if (data.moduleVisibility) {
    const parsed = typeof data.moduleVisibility === 'string'
      ? JSON.parse(data.moduleVisibility)
      : data.moduleVisibility;
    return { ...DEFAULT_VISIBILITY, ...parsed };
  }
  return DEFAULT_VISIBILITY;
}

async function saveModuleVisibility(visibility: ModuleVisibility): Promise<void> {
  const response = await fetch('/api/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaign_id: 1, preferences: { moduleVisibility: visibility } }),
  });
  if (!response.ok) throw new Error('Failed to save preferences');
}

const MODULE_LABELS: Record<ModuleId, string> = {
  'initiative-tracker': 'Initiative Tracker',
  'character-panel': 'Character Panel',
  'npc-panel': 'NPC Panel',
  'monster-database': 'Monster Database',
  'siege-mechanics': 'Siege Mechanics',
  'ai-assistant': 'AI Assistant',
  'city-map': 'City Map',
};

interface LayoutManagerProps {
  children?: ReactNode;
  renderModule?: (moduleId: ModuleId) => ReactNode;
}

const DEFAULT_LAYOUT: LayoutConfiguration = {
  columnCount: 3,
  modulePositions: MODULE_IDS.map((id, index) => ({
    moduleId: id,
    column: index % 3,
    row: Math.floor(index / 3),
    isExpanded: false,
  })),
};

async function fetchLayoutConfig(): Promise<LayoutConfiguration> {
  const response = await fetch('/api/layout');
  if (!response.ok) throw new Error('Failed to fetch layout');
  const data = await response.json();
  if (!data.modulePositions || data.modulePositions.length === 0) {
    return DEFAULT_LAYOUT;
  }
  return data as LayoutConfiguration;
}

async function saveLayoutConfig(config: LayoutConfiguration): Promise<void> {
  const response = await fetch('/api/layout', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ layoutConfiguration: config }),
  });
  if (!response.ok) throw new Error('Failed to save layout');
}

export default function LayoutManager({ renderModule }: LayoutManagerProps) {
  const [layout, setLayout] = useState<LayoutConfiguration>(DEFAULT_LAYOUT);
  const [visibility, setVisibility] = useState<ModuleVisibility>(DEFAULT_VISIBILITY);
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibilitySaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load layout from API on mount
  useEffect(() => {
    fetchLayoutConfig()
      .then((config) => setLayout(config))
      .catch(() => setLayout(DEFAULT_LAYOUT));
  }, []);

  // Load visibility preferences on mount
  useEffect(() => {
    fetchModuleVisibility()
      .then((vis) => setVisibility(vis))
      .catch(() => setVisibility(DEFAULT_VISIBILITY));
  }, []);

  // Debounced save for visibility preferences
  const debouncedSaveVisibility = useCallback((vis: ModuleVisibility) => {
    if (visibilitySaveRef.current) {
      clearTimeout(visibilitySaveRef.current);
    }
    visibilitySaveRef.current = setTimeout(() => {
      saveModuleVisibility(vis).catch((err) =>
        console.error('Failed to save visibility preferences:', err)
      );
    }, 1000);
  }, []);

  const toggleModuleVisibility = useCallback(
    (moduleId: ModuleId) => {
      setVisibility((prev) => {
        const updated = { ...prev, [moduleId]: !prev[moduleId] };
        debouncedSaveVisibility(updated);
        return updated;
      });
    },
    [debouncedSaveVisibility]
  );

  // Debounced save to API
  const debouncedSave = useCallback((config: LayoutConfiguration) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveLayoutConfig(config).catch((err) =>
        console.error('Failed to save layout:', err)
      );
    }, 1000);
  }, []);

  const setColumnCount = useCallback(
    (count: string) => {
      const numCount = parseInt(count, 10) as 2 | 3 | 4;
      if (![2, 3, 4].includes(numCount)) return;

      const newLayout: LayoutConfiguration = {
        ...layout,
        columnCount: numCount,
        modulePositions: layout.modulePositions.map((pos, index) => ({
          ...pos,
          column: index % numCount,
          row: Math.floor(index / numCount),
        })),
      };
      setLayout(newLayout);
      debouncedSave(newLayout);
    },
    [layout, debouncedSave]
  );

  const moveModule = useCallback(
    (moduleId: string, newIndex: number) => {
      const positions = [...layout.modulePositions];
      const currentIndex = positions.findIndex((p) => p.moduleId === moduleId);
      if (currentIndex === -1 || currentIndex === newIndex) return;

      const [moved] = positions.splice(currentIndex, 1);
      positions.splice(newIndex, 0, moved);

      // Recalculate grid positions
      const updatedPositions = positions.map((pos, index) => ({
        ...pos,
        column: index % layout.columnCount,
        row: Math.floor(index / layout.columnCount),
      }));

      const newLayout: LayoutConfiguration = {
        ...layout,
        modulePositions: updatedPositions,
      };
      setLayout(newLayout);
      debouncedSave(newLayout);
    },
    [layout, debouncedSave]
  );

  const expandModule = useCallback(
    (moduleId: string) => {
      const newLayout: LayoutConfiguration = {
        ...layout,
        modulePositions: layout.modulePositions.map((pos) =>
          pos.moduleId === moduleId ? { ...pos, isExpanded: true } : pos
        ),
      };
      setLayout(newLayout);
      debouncedSave(newLayout);
    },
    [layout, debouncedSave]
  );

  const shrinkModule = useCallback(
    (moduleId: string) => {
      const newLayout: LayoutConfiguration = {
        ...layout,
        modulePositions: layout.modulePositions.map((pos) =>
          pos.moduleId === moduleId ? { ...pos, isExpanded: false } : pos
        ),
      };
      setLayout(newLayout);
      debouncedSave(newLayout);
    },
    [layout, debouncedSave]
  );

  // Drag and Drop handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, moduleId: string) => {
    setDraggedModule(moduleId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', moduleId);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(index);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    const moduleId = e.dataTransfer.getData('text/plain');
    if (moduleId) {
      moveModule(moduleId, targetIndex);
    }
    setDraggedModule(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedModule(null);
    setDropTarget(null);
  };

  // Determine grid class based on column count
  const gridClass =
    layout.columnCount === 2
      ? 'grid-cols-2'
      : layout.columnCount === 4
        ? 'grid-cols-4'
        : 'grid-cols-3';

  return (
    <div className="w-full">
      {/* Column count selector */}
      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="column-selector" className="text-sm font-medium text-gray-700">
          Columns:
        </label>
        <Select
          id="column-selector"
          value={String(layout.columnCount)}
          onValueChange={setColumnCount}
          className="w-32"
        >
          <SelectItem value="2">2 Columns</SelectItem>
          <SelectItem value="3">3 Columns</SelectItem>
          <SelectItem value="4">4 Columns</SelectItem>
        </Select>
      </div>

      {/* Module grid */}
      <div className={`grid ${gridClass} gap-4`}>
        {layout.modulePositions.map((pos, index) => {
          const moduleId = pos.moduleId as ModuleId;
          const isBeingDragged = draggedModule === pos.moduleId;
          const isDropTarget = dropTarget === index;
          const isVisible = visibility[moduleId] !== false;
          const spanClass = pos.isExpanded
            ? layout.columnCount === 2
              ? 'col-span-2'
              : layout.columnCount === 3
                ? 'col-span-3'
                : 'col-span-4'
            : '';

          return (
            <div
              key={pos.moduleId}
              className={`${spanClass} ${isBeingDragged ? 'opacity-50' : ''} ${isDropTarget ? 'ring-2 ring-blue-400 ring-offset-2' : ''} transition-all`}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              <Card className="h-full">
                {/* Draggable header */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, pos.moduleId)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-gray-200 pb-2 mb-2"
                >
                  <Title className="text-sm">
                    {MODULE_LABELS[moduleId] || pos.moduleId}
                  </Title>
                  <div className="flex gap-1">
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => toggleModuleVisibility(moduleId)}
                      aria-label={`${isVisible ? 'Hide' : 'Show'} ${MODULE_LABELS[moduleId]}`}
                    >
                      {isVisible ? 'Hide' : 'Show'}
                    </Button>
                    {pos.isExpanded ? (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => shrinkModule(pos.moduleId)}
                        aria-label={`Shrink ${MODULE_LABELS[moduleId]}`}
                      >
                        Shrink
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => expandModule(pos.moduleId)}
                        aria-label={`Expand ${MODULE_LABELS[moduleId]}`}
                      >
                        Expand
                      </Button>
                    )}
                  </div>
                </div>

                {/* Module content - only rendered when visible */}
                {isVisible && (
                  <div className="min-h-[100px]">
                    {renderModule
                      ? renderModule(moduleId)
                      : <span className="text-gray-400 text-sm">{MODULE_LABELS[moduleId]}</span>}
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { fetchLayoutConfig, saveLayoutConfig, fetchModuleVisibility, saveModuleVisibility };
export type { LayoutManagerProps };
