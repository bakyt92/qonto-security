import { useEffect, useState } from 'react';
import { buildScenarios } from '../fixtures/scenarios.js';
export function App() {
  const [_runs, setRuns] = useState<any[]>([]);
  useEffect(() => { buildScenarios().then(setRuns); }, []);
  return <div className="app"><h1>Finance PR for Qonto MCP</h1></div>;
}
