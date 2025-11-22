/**
 * TypeScript types for character data from Physda-Labs/technocracy
 * Generated from the consolidated all-characters.json file
 */

export interface CharacterAttributes {
  skin_color: string;
  hair_color: string;
  hair_style: string;
  shirt_color: string;
  leg_color: string;
  leg_type: 'pants' | 'leggings';
  shoe_color: string;
}

export interface SpriteData {
  url: string;
  generated: string;
  layers: string[];
}

export interface CharacterSprites {
  idle: SpriteData;
  walk: SpriteData;
  sit: SpriteData;
}

export interface Character {
  id: number;
  gender: 'male' | 'female';
  description: string;
  attributes: CharacterAttributes;
  sprites: CharacterSprites;
}

export interface CharactersData {
  version: string;
  totalCharacters: number;
  generatedAt: string;
  characters: Record<string, Character>;
}

/**
 * Helper function to get character by ID
 */
export function getCharacterById(data: CharactersData, id: number): Character | undefined {
  const key = `character_${id.toString().padStart(4, '0')}`;
  return data.characters[key];
}

/**
 * Helper function to get all characters as an array
 */
export function getAllCharacters(data: CharactersData): Character[] {
  return Object.values(data.characters);
}

/**
 * Helper function to filter characters by gender
 */
export function getCharactersByGender(data: CharactersData, gender: 'male' | 'female'): Character[] {
  return getAllCharacters(data).filter(char => char.gender === gender);
}

/**
 * Helper function to filter characters by attribute
 */
export function getCharactersByAttribute(
  data: CharactersData,
  attribute: keyof CharacterAttributes,
  value: string
): Character[] {
  return getAllCharacters(data).filter(char => char.attributes[attribute] === value);
}

/**
 * Helper function to get random character
 */
export function getRandomCharacter(data: CharactersData): Character {
  const characters = getAllCharacters(data);
  const randomIndex = Math.floor(Math.random() * characters.length);
  return characters[randomIndex];
}

/**
 * Helper function to get character sprite URL
 */
export function getCharacterSpriteUrl(
  character: Character,
  animation: 'idle' | 'walk' | 'sit'
): string {
  return character.sprites[animation].url;
}
