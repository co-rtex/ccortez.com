/** Controls listed in the How to play dialog. Keep in sync with PlayerController and App key handling. */
export const HOW_TO_PLAY_CONTROLS: Array<{ keys: string[]; action: string }> = [
  { keys: ['W', 'A', 'S', 'D'], action: 'Walk (arrow keys work too)' },
  { keys: ['Shift'], action: 'Hold to run' },
  { keys: ['E'], action: 'Open a nearby workbench, or sit on a bench' },
  { keys: ['Esc'], action: 'Close a panel or stand up' },
];
