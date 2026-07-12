export type Beat = { label: string; caption: string; at: number };
export type ScenarioId = 'A' | 'B' | 'C' | 'D1' | 'D2' | 'D3';
export interface Scenario { id: ScenarioId; title: string; teaching: string; }
export interface ScenarioRun {
  id: ScenarioId;
  title: string;
  teaching: string;
  scenario: Scenario;
  events: any[];
  prepare: any;
  act: any | null;
  stored: any;
  beats: Beat[];
}