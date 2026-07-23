export const IPC_TYPE_CHARACTER = 'sloppy-keyboard:type-character';
export const IPC_CLOSE_WINDOW = 'sloppy-keyboard:close-window';
export const IPC_MINIMIZE_WINDOW = 'sloppy-keyboard:minimize-window';

export interface TypeResult {
  ok: boolean;
  error?: string;
}

export interface SloppyKeyboardApi {
  typeCharacter: (character: string) => Promise<TypeResult>;
  closeWindow: () => void;
  minimizeWindow: () => void;
}
