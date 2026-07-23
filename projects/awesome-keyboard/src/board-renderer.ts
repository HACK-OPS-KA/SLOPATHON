import { Body, Composite } from 'matter-js';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  LAUNCH_HEIGHT,
  BoardPhysics,
} from './board-physics';

export class BoardRenderer {
  private readonly context: CanvasRenderingContext2D;
  private animationFrame = 0;
  private activeSlot: number | null = null;
  private activeCharacter = '';
  private flashUntil = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly physics: BoardPhysics,
    private readonly getLetters: () => string[],
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable.');
    this.context = context;
    this.resize();
  }

  start(): void {
    const draw = (): void => {
      this.render();
      this.animationFrame = requestAnimationFrame(draw);
    };
    this.animationFrame = requestAnimationFrame(draw);
  }

  flash(slot: number, character: string): void {
    this.activeSlot = slot;
    this.activeCharacter = character;
    this.flashUntil = performance.now() + 480;
  }

  toBoardX(clientX: number): number {
    const bounds = this.canvas.getBoundingClientRect();
    return ((clientX - bounds.left) / bounds.width) * BOARD_WIDTH;
  }

  isLaunchRail(clientY: number): boolean {
    const bounds = this.canvas.getBoundingClientRect();
    const y = ((clientY - bounds.top) / bounds.height) * BOARD_HEIGHT;
    return y <= LAUNCH_HEIGHT;
  }

  private resize(): void {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = BOARD_WIDTH * ratio;
    this.canvas.height = BOARD_HEIGHT * ratio;
    this.context.scale(ratio, ratio);
  }

  private render(): void {
    const ctx = this.context;
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    this.drawBackground(ctx);
    this.drawPins(ctx);
    this.drawSlots(ctx);
    this.drawBalls(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    ctx.fillStyle = '#000080';
    ctx.fillRect(0, 0, BOARD_WIDTH, LAUNCH_HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "MS Sans Serif", Tahoma, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('DROP ZONE — CLICK TO INSERT BALL', 12, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(22, 31);
    ctx.lineTo(BOARD_WIDTH - 22, 31);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawPins(ctx: CanvasRenderingContext2D): void {
    const bodies = Composite.allBodies(this.physics.engine.world);
    for (const body of bodies) {
      if (!body.isStatic || body.isSensor || !body.circleRadius) continue;
      ctx.beginPath();
      ctx.arc(
        body.position.x,
        body.position.y,
        body.circleRadius,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = '#808080';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.beginPath();
      ctx.arc(body.position.x - 2, body.position.y - 2, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }

  private drawSlots(ctx: CanvasRenderingContext2D): void {
    const slotWidth = BOARD_WIDTH / 10;
    const letters = this.getLetters();
    for (let slot = 0; slot < 10; slot += 1) {
      const x = slot * slotWidth;
      const flashing = this.activeSlot === slot
        && performance.now() < this.flashUntil;
      ctx.fillStyle = flashing ? '#000080' : '#c0c0c0';
      ctx.fillRect(x + 3, 490, slotWidth - 6, 67);
      ctx.strokeStyle = flashing ? '#ffffff' : '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, 491, slotWidth - 8, 65);
      ctx.fillStyle = flashing ? '#ffffff' : '#000000';
      ctx.font = 'bold 38px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const visibleCharacter = flashing ? this.activeCharacter : letters[slot];
      ctx.fillText(visibleCharacter, x + slotWidth / 2, 526);
    }
  }

  private drawBalls(ctx: CanvasRenderingContext2D): void {
    for (const { body } of this.physics.balls.values()) {
      this.drawBall(ctx, body);
    }
  }

  private drawBall(ctx: CanvasRenderingContext2D, body: Body): void {
    const gradient = ctx.createRadialGradient(
      body.position.x - 3,
      body.position.y - 4,
      1,
      body.position.x,
      body.position.y,
      10,
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.24, '#ff0000');
    gradient.addColorStop(1, '#800000');
    ctx.beginPath();
    ctx.arc(body.position.x, body.position.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowColor = 'transparent';
  }
}
