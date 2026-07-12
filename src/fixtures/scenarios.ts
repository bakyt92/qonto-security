export async function buildScenarios() {
  return [{
    id: 'A', title: 'Clean', teaching: 'test',
    scenario: {} as any,
    events: [], prepare: {}, act: null, stored: {} as any, beats: []
  }];
}
