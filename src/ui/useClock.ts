export function useClock(playing: boolean, onTick: (dt: number) => void) {
  return { playing, onTick };
}