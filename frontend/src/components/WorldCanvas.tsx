/**
 * Canvas component for rendering the character world
 */

'use client';

import { useRef, useEffect, forwardRef } from 'react';
import type { Camera } from '@/src/hooks/useCamera';
import type { SimulationCharacter } from '@/src/lib/character';
import { WORLD_CONFIG } from '@/src/lib/world';
import { drawGrid } from '@/src/lib/canvas-utils';

interface WorldCanvasProps {
  characters: SimulationCharacter[];
  camera: Camera;
  onWheel: (e: WheelEvent) => void;
  onMouseDown: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: () => void;
  isDragging: boolean;
}

export const WorldCanvas = forwardRef<HTMLCanvasElement, WorldCanvasProps>(
  function WorldCanvas(
    { characters, camera, onWheel, onMouseDown, onMouseMove, onMouseUp, isDragging },
    ref
  ) {
    const internalRef = useRef<HTMLCanvasElement>(null);
    const canvasRef = (ref as React.RefObject<HTMLCanvasElement>) || internalRef;

    // Use refs to access latest values without restarting render loop
    const charactersRef = useRef(characters);
    const cameraRef = useRef(camera);

    useEffect(() => {
      charactersRef.current = characters;
    }, [characters]);

    useEffect(() => {
      cameraRef.current = camera;
    }, [camera]);

    // Setup canvas event listeners
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.addEventListener('wheel', onWheel, { passive: false });
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('mouseleave', onMouseUp);

      return () => {
        canvas.removeEventListener('wheel', onWheel);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mouseleave', onMouseUp);
      };
    }, [canvasRef, onWheel, onMouseDown, onMouseMove, onMouseUp]);

    // Setup canvas and resize handling
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeCanvas = () => {
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }, [canvasRef]);

    // Continuous render loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationFrameId: number;

      const render = () => {
        const currentCamera = cameraRef.current;
        const currentCharacters = charactersRef.current;

        // Clear canvas completely
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set image smoothing for better sprite rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Save context state
        ctx.save();

        // Apply camera transformations
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(currentCamera.zoom, currentCamera.zoom);
        ctx.translate(-currentCamera.x, -currentCamera.y);

        // Draw world background
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, WORLD_CONFIG.WIDTH, WORLD_CONFIG.HEIGHT);

        // Draw grid
        drawGrid(ctx, WORLD_CONFIG.WIDTH, WORLD_CONFIG.HEIGHT);

        // Sort characters by Y position (painter's algorithm)
        const sortedCharacters = [...currentCharacters].sort((a, b) => a.y - b.y);

        // Draw all characters
        for (const character of sortedCharacters) {
          character.draw(ctx);
        }

        // Restore context state
        ctx.restore();

        // Continue the loop
        animationFrameId = requestAnimationFrame(render);
      };

      // Start the render loop
      animationFrameId = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }, [canvasRef]);

    return (
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      />
    );
  }
);
