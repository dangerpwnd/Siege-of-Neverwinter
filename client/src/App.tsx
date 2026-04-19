import { Card, Title, Text, Badge } from '@tremor/react';
import LayoutManager from './components/LayoutManager';
import InitiativeTracker from './components/InitiativeTracker';
import CharacterPanel from './components/CharacterPanel';
import NPCPanel from './components/NPCPanel';
import MonsterDatabase from './components/MonsterDatabase';
import SiegeMechanics from './components/SiegeMechanics';
import CityMap from './components/CityMap';
import AIAssistant from './components/AIAssistant';
import type { ModuleId } from './types/layout';

function renderModule(moduleId: ModuleId) {
  switch (moduleId) {
    case 'initiative-tracker':
      return <InitiativeTracker />;
    case 'character-panel':
      return <CharacterPanel />;
    case 'npc-panel':
      return <NPCPanel />;
    case 'monster-database':
      return <MonsterDatabase />;
    case 'siege-mechanics':
      return <SiegeMechanics />;
    case 'city-map':
      return <CityMap />;
    case 'ai-assistant':
      return <AIAssistant />;
    default:
      return null;
  }
}

function App() {
  return (
    <main className="p-6 max-w-7xl mx-auto">
      <Card className="mb-6">
        <div className="flex items-center gap-3">
          <Title>Siege of Neverwinter</Title>
          <Badge color="red">Active Siege</Badge>
        </div>
        <Text>D&amp;D 5e Campaign Management Tool</Text>
      </Card>

      <LayoutManager renderModule={renderModule} />
    </main>
  );
}

export default App;
