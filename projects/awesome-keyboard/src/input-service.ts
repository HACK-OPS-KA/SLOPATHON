import { keyboard } from '@nut-tree-fork/nut-js';
import type { TypeResult } from './contracts';

let typingQueue: Promise<unknown> = Promise.resolve();

keyboard.config.autoDelayMs = 0;

export const typeCharacter = (character: string): Promise<TypeResult> => {
  if (!/^[a-z]$/.test(character)) {
    return Promise.resolve({
      ok: false,
      error: 'Only one lowercase letter is allowed.',
    });
  }

  const task = typingQueue.then(() => keyboard.type(character));
  typingQueue = task.catch((): void => undefined);
  return task
    .then(() => ({ ok: true }))
    .catch((error: unknown) => ({
      ok: false,
      error: error instanceof Error
        ? error.message
        : 'Windows rejected the key press.',
    }));
};
