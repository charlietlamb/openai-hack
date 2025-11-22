/**
 * Hook to load character data using TanStack Query
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CharactersData, Character } from '@/src/types/character';
import { WORLD_CONFIG } from '@/src/lib/world';

/**
 * Fetch character data from the JSON file
 */
async function fetchCharacterData(): Promise<CharactersData> {
  const response = await fetch('/characters/data/all-characters.json');
  if (!response.ok) {
    throw new Error('Failed to load character data');
  }
  return response.json();
}

/**
 * Select a random subset of characters
 */
function selectRandomCharacters(
  charactersData: CharactersData,
  count: number
): Character[] {
  const allCharacters = Object.values(charactersData.characters);

  // Shuffle and select first N characters
  const shuffled = [...allCharacters].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Hook to load and select random characters
 */
export function useCharacterData(count: number = WORLD_CONFIG.NUM_CHARACTERS) {
  const query = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacterData,
    staleTime: Infinity, // Data never goes stale
    gcTime: Infinity, // Keep in cache forever
  });

  // Select random characters from the loaded data (memoized to prevent re-selection on every render)
  const selectedCharacters = useMemo(() => {
    return query.data ? selectRandomCharacters(query.data, count) : [];
  }, [query.data, count]);

  return {
    characters: selectedCharacters,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
