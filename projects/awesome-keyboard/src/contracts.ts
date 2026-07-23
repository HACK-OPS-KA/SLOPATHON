export const IPC_TYPE_CHARACTER = 'sloppy-keyboard:type-character';
export const IPC_CLOSE_WINDOW = 'sloppy-keyboard:close-window';

export interface TypeResult {
  ok: boolean;
  error?: string;
}

export interface SloppyKeyboardApi {
  typeCharacter: (character: string) => Promise<TypeResult>;
  closeWindow: () => void;
}
