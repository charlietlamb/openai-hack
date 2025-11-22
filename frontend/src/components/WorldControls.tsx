/**
 * UI overlay controls for the character world
 */

'use client';

import { useState } from 'react';

interface WorldControlsProps {
  onAsk: (question: string) => void;
}

export function WorldControls({ onAsk }: WorldControlsProps) {
  const [question, setQuestion] = useState('');

  const handleAsk = () => {
    if (question.trim()) {
      onAsk(question);
      setQuestion('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAsk();
    }
  };

  return (
    <>
      {/* Top UI Panel */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 flex gap-3 items-center">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask the villagers something..."
            className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 text-gray-900"
          />
          <button
            onClick={handleAsk}
            disabled={!question.trim()}
            className="px-6 py-2 rounded-md bg-gradient-to-br from-purple-600 to-blue-500 text-white font-medium hover:from-purple-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Ask
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-white text-sm">
          <p className="font-medium mb-1">Controls:</p>
          <p>🖱️ Scroll to zoom</p>
          <p>👆 Click and drag to pan</p>
        </div>
      </div>

      {/* Character Count */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm font-medium">
          🧑‍🤝‍🧑 100 Characters
        </div>
      </div>
    </>
  );
}
