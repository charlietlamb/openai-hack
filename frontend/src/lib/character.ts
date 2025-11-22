/**
 * Character class for the simulation
 */

import type { Character as CharacterData } from '@/src/types/character';
import {
  CHARACTER_CONFIG,
  WORLD_CONFIG,
  SPEECH_CONFIG,
  Direction,
  CharacterState,
  getRandomResponse,
} from './world';
import { drawSprite, drawShadow, drawSpeechBubble } from './canvas-utils';

export class SimulationCharacter {
  // Identity
  id: string;
  data: CharacterData;

  // Position and movement
  x: number;
  y: number;
  vx: number;
  vy: number;

  // Animation
  frameIndex: number = 0;
  row: Direction = Direction.DOWN;
  tickCount: number = 0;

  // State
  state: CharacterState = CharacterState.WANDERING;
  speechText: string = '';
  speechTimer: number = 0;
  pendingSpeechTimeout: NodeJS.Timeout | null = null;

  // Sprite image
  image: HTMLImageElement | null = null;
  imageLoaded: boolean = false;

  constructor(characterData: CharacterData, x: number, y: number, vx: number, vy: number) {
    this.id = characterData.id.toString();
    this.data = characterData;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;

    // Load sprite image
    this.loadImage();
  }

  /**
   * Load the character's walk sprite
   */
  private loadImage(): void {
    this.image = new Image();

    // Allow cross-origin if needed
    this.image.crossOrigin = 'anonymous';

    this.image.onload = () => {
      this.imageLoaded = true;
    };

    this.image.onerror = (error) => {
      console.error(`Failed to load sprite for character ${this.id}:`, this.data.sprites.walk.url, error);
      this.imageLoaded = false;
    };

    // Use the walk sprite from the character data
    this.image.src = this.data.sprites.walk.url;
  }

  /**
   * Update character position and state
   */
  update(deltaTime: number = 1, allCharacters: SimulationCharacter[] = []): void {
    // Update speech timer
    if (this.state === CharacterState.TALKING) {
      this.speechTimer -= deltaTime * 16.67; // Approximate ms per frame at 60fps
      if (this.speechTimer <= 0) {
        this.state = CharacterState.WANDERING;
        this.speechText = '';
      }
    }

    // Move character
    this.move();

    // Handle collisions if other characters are provided
    if (allCharacters.length > 0) {
      this.handleCollisions(allCharacters);
    }

    // Update animation
    this.updateAnimation();
  }

  /**
   * Move the character and handle world boundaries
   */
  private move(): void {
    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off world boundaries
    if (this.x < 0 || this.x > WORLD_CONFIG.WIDTH) {
      this.vx *= -1;
      this.x = Math.max(0, Math.min(WORLD_CONFIG.WIDTH, this.x));
    }
    if (this.y < 0 || this.y > WORLD_CONFIG.HEIGHT) {
      this.vy *= -1;
      this.y = Math.max(0, Math.min(WORLD_CONFIG.HEIGHT, this.y));
    }

    // Randomly change direction
    if (Math.random() < CHARACTER_CONFIG.DIRECTION_CHANGE_CHANCE) {
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * CHARACTER_CONFIG.SPEED;
      this.vy = Math.sin(angle) * CHARACTER_CONFIG.SPEED;
    }
  }

  /**
   * Handle collisions with other characters
   */
  private handleCollisions(others: SimulationCharacter[]): void {
    for (const other of others) {
      if (other.id === this.id) continue;

      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = CHARACTER_CONFIG.HITBOX_RADIUS * 2;

      if (distance < minDistance) {
        // Collision detected: Push apart
        const angle = Math.atan2(dy, dx);

        const targetX = this.x + Math.cos(angle) * minDistance;
        const targetY = this.y + Math.sin(angle) * minDistance;

        const ax = (targetX - other.x) * 0.05;
        const ay = (targetY - other.y) * 0.05;

        this.vx -= ax;
        this.vy -= ay;
        other.vx += ax;
        other.vy += ay;
      }
    }
  }

  /**
   * Update animation frame based on movement direction
   */
  private updateAnimation(): void {
    // Determine direction based on velocity
    const absVx = Math.abs(this.vx);
    const absVy = Math.abs(this.vy);

    if (absVx > absVy) {
      // Moving more horizontally
      this.row = this.vx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      // Moving more vertically
      this.row = this.vy > 0 ? Direction.DOWN : Direction.UP;
    }

    // Cycle through frames
    this.tickCount += CHARACTER_CONFIG.ANIMATION_SPEED;
    if (this.tickCount >= 1) {
      this.tickCount = 0;
      this.frameIndex = (this.frameIndex + 1) % 9;
    }
  }

  /**
   * Make the character say something
   */
  ask(question: string): void {
    // Clear any pending speech
    if (this.pendingSpeechTimeout) {
      clearTimeout(this.pendingSpeechTimeout);
      this.pendingSpeechTimeout = null;
    }

    // Immediate response
    this.speechText = getRandomResponse();
    this.speechTimer = SPEECH_CONFIG.DURATION_MS;
    this.state = CharacterState.TALKING;
  }

  /**
   * Draw the character on the canvas
   */
  draw(ctx: CanvasRenderingContext2D): void {
    const currentW = CHARACTER_CONFIG.WIDTH;
    const currentH = CHARACTER_CONFIG.HEIGHT;

    // Don't draw anything if sprite isn't loaded
    if (!this.imageLoaded || !this.image || !this.image.complete || this.image.naturalWidth === 0) {
      return;
    }

    ctx.save();

    // Draw shadow
    drawShadow(ctx, this.x, this.y, currentW);

    // Draw sprite
    try {
      drawSprite(
        ctx,
        this.image,
        this.frameIndex,
        this.row,
        this.x,
        this.y,
        currentW,
        currentH
      );
    } catch (error) {
      // Silently fail if sprite drawing fails
      console.error('Error drawing sprite:', error);
    }

    // Draw speech bubble if talking
    if (this.state === CharacterState.TALKING && this.speechText) {
      drawSpeechBubble(ctx, this.x, this.y - currentH / 2, this.speechText, 12);
    }

    ctx.restore();
  }

  /**
   * Cleanup method to clear timeouts
   */
  cleanup(): void {
    if (this.pendingSpeechTimeout) {
      clearTimeout(this.pendingSpeechTimeout);
      this.pendingSpeechTimeout = null;
    }
  }
}
