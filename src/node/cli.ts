#!/usr/bin/env -S npx tsx
import { buildScenarios } from '../fixtures/scenarios.js';
async function main() {
  const runs = await buildScenarios();
  console.log('Scenarios:', runs.length);
}
main().catch(console.error);