import './index.css';
import { BoardPhysics } from './board-physics';
import { BoardRenderer, LANDING_FLASH_MS } from './board-renderer';
import { BoardState } from './board-state';
import { MinigameReel } from './minigame-reel';

const required = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing interface element: ${selector}`);
  return element;
};

const canvas = required<HTMLCanvasElement>('#board');
const closeButton = required<HTMLButtonElement>('#close');
const minimizeButton = required<HTMLButtonElement>('#minimize');
const ballCount = required<HTMLElement>('#ball-count');
const status = required<HTMLElement>('#status');
const typedValue = required<HTMLElement>('#typed-value');
const selector = new MinigameReel(required<HTMLElement>('#selector'));

const board = new BoardState();
const rendererRef: { current?: BoardRenderer } = {};
let phase: 'ready' | 'highlight' | 'selector' = 'ready';
let completionTimer: number | undefined;

const updateControls = (): void => {
  ballCount.textContent = String(board.activeBalls).padStart(2, '0');
  if (phase === 'highlight') status.textContent = 'REGISTERING HIT...';
  else if (phase === 'selector') status.textContent = 'MYSTERY EVENT ACTIVE';
  else if (board.specialPending) {
    status.textContent = `MYSTERY ARMED · ${board.activeBalls} BALLS REMAIN`;
  }
  else {
    status.textContent = board.activeBalls > 0
      ? 'VOLLEY IN PROGRESS'
      : 'READY · CLICK THE DROP RAIL';
  }
};

const showStatus = (message: string, isError = false): void => {
  status.textContent = message;
  status.classList.toggle('error', isError);
  if (isError) {
    window.setTimeout(() => status.classList.remove('error'), 1800);
  }
};

const completeVolley = async (): Promise<void> => {
  if (!board.specialPending) {
    board.reroll();
    rendererRef.current?.resetSpecial();
    phase = 'ready';
    updateControls();
    return;
  }
  phase = 'selector';
  updateControls();
  try {
    const draw = await window.sloppyKeyboard.drawMinigame();
    const winner = await selector.spin(draw);
    const result = await window.sloppyKeyboard.runMinigame(winner.id);
    selector.hide();
    showStatus(
      result.message ?? (
        result.status === 'completed' ? 'MINIGAME COMPLETE' : 'MINIGAME ENDED'
      ),
      result.status === 'failed',
    );
  } catch {
    selector.hide();
    showStatus('MINIGAME FAILED SAFELY', true);
  } finally {
    board.reroll();
    rendererRef.current?.resetSpecial();
    phase = 'ready';
    window.setTimeout(updateControls, 1800);
  }
};

const finishAfterHighlight = (): void => {
  phase = 'highlight';
  updateControls();
  completionTimer = window.setTimeout(() => {
    completionTimer = undefined;
    void completeVolley();
  }, LANDING_FLASH_MS);
};

const physics = new BoardPhysics({
  onLanding: (_ballId, slot) => {
    const landing = board.land(slot);
    rendererRef.current?.flash(slot, landing.value);
    if (landing.value.kind === 'letter') {
      const character = landing.value.character;
      typedValue.textContent = character;
      typedValue.classList.remove('pop');
      void typedValue.offsetWidth;
      typedValue.classList.add('pop');
      showStatus(`TRANSMITTING “${character}”`);
      void window.sloppyKeyboard.typeCharacter(character).then((result) => {
        if (!result.ok) showStatus('INPUT BLOCKED · FOCUS A NORMAL WINDOW', true);
      });
    } else {
      rendererRef.current?.celebrateSpecial(slot);
      showStatus('MYSTERY SLOT ARMED · FINISHING VOLLEY');
    }
    if (landing.volleyFinished) finishAfterHighlight();
    else updateControls();
  },
  onAbandon: () => {
    if (board.abandon()) void completeVolley();
    else updateControls();
  },
});

const renderer = new BoardRenderer(canvas, physics, () => board.slots);
rendererRef.current = renderer;

canvas.addEventListener('pointerdown', (event) => {
  if (!renderer.isLaunchRail(event.clientY)) return;
  if (phase !== 'ready') {
    showStatus('WAIT FOR THE MACHINE TO RESET');
    return;
  }
  if (physics.launch(renderer.toBoardX(event.clientX))) {
    board.launch();
    updateControls();
  } else showStatus('BALL LIMIT REACHED');
});

closeButton.addEventListener('click', () => window.sloppyKeyboard.closeWindow());
minimizeButton.addEventListener('click', () =>
  window.sloppyKeyboard.minimizeWindow());
window.addEventListener('beforeunload', () => {
  physics.stop();
  if (completionTimer !== undefined) window.clearTimeout(completionTimer);
});

updateControls();
physics.start();
renderer.start();
