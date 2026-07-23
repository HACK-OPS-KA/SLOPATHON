import { describe, expect, it } from 'vitest';
import { BoardState, generateLetters } from './board-state';

describe('generateLetters', () => {
  it('returns ten unique lowercase letters', () => {
    const letters = generateLetters(() => 0.42);
    expect(letters).toHaveLength(10);
    expect(new Set(letters).size).toBe(10);
    expect(letters.every((letter) => /^[a-z]$/.test(letter))).toBe(true);
  });
});

describe('BoardState', () => {
  it('keeps letters stable until the final ball lands', () => {
    const board = new BoardState(() => 0.2);
    const initial = [...board.letters];
    board.launch();
    board.launch();

    expect(board.land(2)).toEqual({
      character: initial[2],
      shouldReroll: false,
    });
    expect(board.letters).toEqual(initial);
    expect(board.land(7)).toEqual({
      character: initial[7],
      shouldReroll: true,
    });
  });

  it('blocks rerolls during a volley', () => {
    const board = new BoardState();
    board.launch();
    expect(() => board.reroll()).toThrow(/active volley/);
  });

  it('finishes a volley when the last ball is abandoned', () => {
    const board = new BoardState();
    board.launch();
    board.launch();
    expect(board.abandon()).toBe(false);
    expect(board.abandon()).toBe(true);
  });

  it('rejects invalid and duplicate landings', () => {
    const board = new BoardState();
    board.launch();
    expect(() => board.land(10)).toThrow(/Invalid/);
    board.land(0);
    expect(() => board.land(0)).toThrow(/Invalid/);
  });
});
