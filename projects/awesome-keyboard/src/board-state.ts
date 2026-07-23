export const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
export const SLOT_COUNT = 10;

export type RandomSource = () => number;

export const generateLetters = (
  random: RandomSource = Math.random,
): string[] => {
  const pool = [...LETTERS];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [pool[index], pool[target]] = [pool[target], pool[index]];
  }
  return pool.slice(0, SLOT_COUNT);
};

export interface Landing {
  character: string;
  shouldReroll: boolean;
}

export class BoardState {
  letters: string[];
  activeBalls = 0;

  constructor(private readonly random: RandomSource = Math.random) {
    this.letters = generateLetters(random);
  }

  launch(): void {
    this.activeBalls += 1;
  }

  land(slot: number): Landing {
    if (this.activeBalls === 0 || slot < 0 || slot >= SLOT_COUNT) {
      throw new Error('Invalid ball landing.');
    }
    const character = this.letters[slot];
    this.activeBalls -= 1;
    return { character, shouldReroll: this.activeBalls === 0 };
  }

  abandon(): boolean {
    if (this.activeBalls === 0) return false;
    this.activeBalls -= 1;
    return this.activeBalls === 0;
  }

  reroll(): void {
    if (this.activeBalls > 0) {
      throw new Error('Cannot skip during an active volley.');
    }
    this.letters = generateLetters(this.random);
  }
}
