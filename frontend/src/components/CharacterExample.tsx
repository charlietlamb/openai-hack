/**
 * Example React component showing how to use the character data
 * This demonstrates loading and displaying character sprites
 */

import { useState, useEffect } from 'react';
import type { CharactersData, Character } from '@/types/character';
import {
  getAllCharacters,
  getCharacterById,
  getCharactersByGender,
  getRandomCharacter,
  getCharacterSpriteUrl,
} from '@/types/character';

export function CharacterExample() {
  const [charactersData, setCharactersData] = useState<CharactersData | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  // Load character data on component mount
  useEffect(() => {
    fetch('/characters/data/all-characters.json')
      .then(res => res.json())
      .then((data: CharactersData) => {
        setCharactersData(data);
        // Select a random character to start
        setSelectedCharacter(getRandomCharacter(data));
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load character data:', error);
        setLoading(false);
      });
  }, []);

  const handleRandomCharacter = () => {
    if (charactersData) {
      setSelectedCharacter(getRandomCharacter(charactersData));
    }
  };

  const handleCharacterById = (id: number) => {
    if (charactersData) {
      const character = getCharacterById(charactersData, id);
      if (character) {
        setSelectedCharacter(character);
      }
    }
  };

  const handleFilterByGender = (gender: 'male' | 'female') => {
    if (charactersData) {
      const filtered = getCharactersByGender(charactersData, gender);
      if (filtered.length > 0) {
        setSelectedCharacter(filtered[0]);
      }
    }
  };

  if (loading) {
    return <div className="p-4">Loading characters...</div>;
  }

  if (!charactersData || !selectedCharacter) {
    return <div className="p-4">Failed to load character data</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Character Viewer</h1>

      <div className="mb-6 flex gap-4">
        <button
          onClick={handleRandomCharacter}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Random Character
        </button>
        <button
          onClick={() => handleFilterByGender('male')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Show Male
        </button>
        <button
          onClick={() => handleFilterByGender('female')}
          className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
        >
          Show Female
        </button>
        <input
          type="number"
          min="1"
          max="1000"
          placeholder="Character ID"
          className="px-4 py-2 border rounded"
          onChange={(e) => handleCharacterById(Number(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Character Info */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Character #{selectedCharacter.id}
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            {selectedCharacter.description}
          </p>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Gender:</span>
              <span>{selectedCharacter.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Skin:</span>
              <span>{selectedCharacter.attributes.skin_color}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Hair:</span>
              <span>{selectedCharacter.attributes.hair_color} {selectedCharacter.attributes.hair_style}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Shirt:</span>
              <span>{selectedCharacter.attributes.shirt_color}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Pants:</span>
              <span>{selectedCharacter.attributes.leg_color} {selectedCharacter.attributes.leg_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Shoes:</span>
              <span>{selectedCharacter.attributes.shoe_color}</span>
            </div>
          </div>
        </div>

        {/* Character Sprites */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Sprites</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-medium mb-2">Idle</p>
              <img
                src={getCharacterSpriteUrl(selectedCharacter, 'idle')}
                alt="Idle sprite"
                className="w-full border rounded"
              />
            </div>
            <div className="text-center">
              <p className="font-medium mb-2">Walk</p>
              <img
                src={getCharacterSpriteUrl(selectedCharacter, 'walk')}
                alt="Walk sprite"
                className="w-full border rounded"
              />
            </div>
            <div className="text-center">
              <p className="font-medium mb-2">Sit</p>
              <img
                src={getCharacterSpriteUrl(selectedCharacter, 'sit')}
                alt="Sit sprite"
                className="w-full border rounded"
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-1">Sprite Layers ({selectedCharacter.sprites.idle.layers.length}):</p>
            <ul className="list-disc list-inside space-y-1">
              {selectedCharacter.sprites.idle.layers.slice(0, 3).map((layer, i) => (
                <li key={i} className="truncate">{layer}</li>
              ))}
              {selectedCharacter.sprites.idle.layers.length > 3 && (
                <li>... and {selectedCharacter.sprites.idle.layers.length - 3} more</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total characters loaded: {charactersData.totalCharacters} |
          Generated: {new Date(charactersData.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
