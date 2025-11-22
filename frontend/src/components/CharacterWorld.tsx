/**
 * Main character world simulation component
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { WorldCanvas } from './WorldCanvas';
import { WorldControls } from './WorldControls';
import { useCharacterData } from '@/src/hooks/useCharacterData';
import { useCamera } from '@/src/hooks/useCamera';
import { useGameLoop } from '@/src/hooks/useGameLoop';
import { SimulationCharacter } from '@/src/lib/character';
import { getRandomPosition, getRandomVelocity } from '@/src/lib/world';

export function CharacterWorld() {
  // Load character data
  const { characters: characterData, isLoading, isError } = useCharacterData();

  // Canvas dimensions (will be updated on mount)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Camera controls
  const {
    camera,
    isDragging,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useCamera(canvasSize.width, canvasSize.height);

  // Initialize simulation characters
  const simulationCharacters = useMemo(() => {
    if (!characterData.length) return [];

    return characterData.map((char) => {
      const { x, y } = getRandomPosition();
      const { vx, vy } = getRandomVelocity();
      return new SimulationCharacter(char, x, y, vx, vy);
    });
  }, [characterData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      simulationCharacters.forEach((char) => char.cleanup());
    };
  }, [simulationCharacters]);

  // Update canvas size on mount/resize
  useEffect(() => {
    const updateSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Game loop - update all characters
  useGameLoop(
    useCallback(
      (deltaTime) => {
        simulationCharacters.forEach((char) => char.update(deltaTime));
      },
      [simulationCharacters]
    ),
    simulationCharacters.length > 0
  );

  // Handle ask question
  const handleAsk = useCallback(
    (question: string) => {
      simulationCharacters.forEach((char) => char.ask(question));
    },
    [simulationCharacters]
  );

  // Loading state (only for character data, not sprites)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading character data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">Failed to load character data</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-md transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900">
      <WorldCanvas
        characters={simulationCharacters}
        camera={camera}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        isDragging={isDragging}
      />
      <WorldControls onAsk={handleAsk} />
    </div>
  );
}
