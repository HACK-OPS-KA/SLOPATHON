export const IPC_TYPE_CHARACTER = 'sloppy-keyboard:type-character';
export const IPC_CLOSE_WINDOW = 'sloppy-keyboard:close-window';
export const IPC_MINIMIZE_WINDOW = 'sloppy-keyboard:minimize-window';
export const IPC_DRAW_MINIGAME = 'sloppy-keyboard:draw-minigame';
export const IPC_RUN_MINIGAME = 'sloppy-keyboard:run-minigame';

export const MINIGAME_IDS = [
  'useless-websites',
  'youtube-shorts',
  'desktop-goose',
  'fake-bluescreen',
] as const;

export type MinigameId = typeof MINIGAME_IDS[number];

export interface MinigameDescriptor {
  id: MinigameId;
  label: string;
  description: string;
  accent: string;
}

export interface MinigameResult {
  status: 'completed' | 'cancelled' | 'failed';
  message?: string;
}

export interface MinigameDraw {
  winner: MinigameDescriptor;
  reel: MinigameDescriptor[];
}

export interface TypeResult {
  ok: boolean;
  error?: string;
}

export interface SloppyKeyboardApi {
  typeCharacter: (character: string) => Promise<TypeResult>;
  drawMinigame: () => Promise<MinigameDraw>;
  runMinigame: (id: MinigameId) => Promise<MinigameResult>;
  closeWindow: () => void;
  minimizeWindow: () => void;
}
