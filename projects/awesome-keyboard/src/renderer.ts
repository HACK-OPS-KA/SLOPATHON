import '@fontsource/bebas-neue';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import './index.css';
import { BoardPhysics } from './board-physics';
import { BoardRenderer } from './board-renderer';
import { BoardState } from './board-state';

const canvas = document.querySelector<HTMLCanvasElement>('#board');
const skipButton = document.querySelector<HTMLButtonElement>('#skip');
const closeButton = document.querySelector<HTMLButtonElement>('#close');
const ballCount = document.querySelector<HTMLElement>('#ball-count');
const status = document.querySelector<HTMLElement>('#status');
const typedValue = document.querySelector<HTMLElement>('#typed-value');

if (
  !canvas
  || !skipButton
  || !closeButton
  || !ballCount
  || !status
  || !typedValue
) {
  throw new Error('The keyboard interface is incomplete.');
}

const board = new BoardState();
const rendererRef: { current?: BoardRenderer } = {};

const updateControls = (): void => {
  ballCount.textContent = String(board.activeBalls).padStart(2, '0');
  skipButton.disabled = board.activeBalls > 0;
  status.textContent = board.activeBalls > 0
    ? 'VOLLEY IN PROGRESS'
    : 'READY · CLICK THE DROP RAIL';
};

const finishVolleyIfNeeded = (shouldReroll: boolean): void => {
  if (shouldReroll) board.reroll();
  updateControls();
};

const physics = new BoardPhysics({
  onLanding: (_ballId, slot) => {
    const landing = board.land(slot);
    rendererRef.current?.flash(slot, landing.character);
    typedValue.textContent = landing.character;
    typedValue.classList.remove('pop');
    void typedValue.offsetWidth;
    typedValue.classList.add('pop');
    status.textContent = `TRANSMITTING “${landing.character}”`;

    void window.sloppyKeyboard
      .typeCharacter(landing.character)
      .then((result) => {
        if (!result.ok) {
          status.textContent = 'INPUT BLOCKED · FOCUS A NORMAL WINDOW';
          status.classList.add('error');
          window.setTimeout(() => status.classList.remove('error'), 1800);
        }
      });
    finishVolleyIfNeeded(landing.shouldReroll);
  },
  onAbandon: () => {
    finishVolleyIfNeeded(board.abandon());
  },
});

const renderer = new BoardRenderer(canvas, physics, () => board.letters);
rendererRef.current = renderer;

canvas.addEventListener('pointerdown', (event) => {
  if (!renderer.isLaunchRail(event.clientY)) return;
  const launched = physics.launch(renderer.toBoardX(event.clientX));
  if (launched) {
    board.launch();
    updateControls();
  } else {
    status.textContent = 'BALL LIMIT REACHED';
  }
});

skipButton.addEventListener('click', () => {
  if (board.activeBalls > 0) return;
  board.reroll();
  status.textContent = 'NEW LETTER BANK LOADED';
  skipButton.classList.remove('spin');
  void skipButton.offsetWidth;
  skipButton.classList.add('spin');
});

closeButton.addEventListener('click', () => {
  window.sloppyKeyboard.closeWindow();
});

window.addEventListener('beforeunload', () => physics.stop());

updateControls();
physics.start();
renderer.start();
