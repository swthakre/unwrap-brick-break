import data from './levels.data.json';
import type { LevelDef } from './core/types.ts';

export const LEVELS = data as unknown as LevelDef[];
export const WORLD_NAMES = ['Garden', 'Sky', 'Ocean', 'City', 'Cosmos'];
