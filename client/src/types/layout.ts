export interface ModulePosition {
  moduleId: string;
  column: number;
  row: number;
  isExpanded: boolean;
}

export interface LayoutConfiguration {
  columnCount: 2 | 3 | 4;
  modulePositions: ModulePosition[];
}

export const MODULE_IDS = [
  'initiative-tracker',
  'character-panel',
  'npc-panel',
  'monster-database',
  'siege-mechanics',
  'ai-assistant',
  'city-map',
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];
