/**
 * World configuration and constants for the character simulation
 */

export const WORLD_CONFIG = {
  WIDTH: 3000,
  HEIGHT: 1500,
  NUM_CHARACTERS: 100,
} as const;

export const CHARACTER_CONFIG = {
  WIDTH: 64,
  HEIGHT: 64,
  HITBOX_RADIUS: 10,
  SPEED: 2, // Increased from 0.5 for more visible movement
  ANIMATION_SPEED: 0.2, // Increased from 0.15 for smoother animation
  DIRECTION_CHANGE_CHANCE: 0.01, // 1% chance per frame
} as const;

export const CAMERA_CONFIG = {
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 5, // Increased from 3 to allow more zoom
  ZOOM_SENSITIVITY: 0.003, // Increased from 0.001 for faster zooming
} as const;

export const SPEECH_CONFIG = {
  DURATION_MS: 5000, // 5 seconds
  MAX_DELAY_MS: 4000, // Maximum stagger delay
  PADDING: 10,
  BORDER_RADIUS: 8,
  POINTER_SIZE: 10,
} as const;

// Sprite animation directions
export enum Direction {
  UP = 0,
  LEFT = 1,
  DOWN = 2,
  RIGHT = 3,
}

// Character states
export enum CharacterState {
  WANDERING = 'WANDERING',
  TALKING = 'TALKING',
}

/**
 * Pre-defined responses for speech bubbles
 */
export const BRAIN_RESPONSES = [
  "I love this!",
  "I'm hungry",
  "Where am I?",
  "This is amazing!",
  "What's happening?",
  "Hello there!",
  "I'm confused",
  "This is fun!",
  "Who are you?",
  "I'm tired",
  "Let's go!",
  "Wow!",
  "Interesting...",
  "Tell me more",
  "I don't know",
  "Maybe later",
  "That's nice",
  "I agree!",
  "Not sure about that",
  "Good point",
];

/**
 * Get a random response from the brain
 */
export function getRandomResponse(): string {
  return BRAIN_RESPONSES[Math.floor(Math.random() * BRAIN_RESPONSES.length)];
}

/**
 * Get a random position within world bounds
 */
export function getRandomPosition(): { x: number; y: number } {
  return {
    x: Math.random() * WORLD_CONFIG.WIDTH,
    y: Math.random() * WORLD_CONFIG.HEIGHT,
  };
}

/**
 * Get a random velocity
 */
export function getRandomVelocity(): { vx: number; vy: number } {
  const angle = Math.random() * Math.PI * 2;
  return {
    vx: Math.cos(angle) * CHARACTER_CONFIG.SPEED,
    vy: Math.sin(angle) * CHARACTER_CONFIG.SPEED,
  };
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
