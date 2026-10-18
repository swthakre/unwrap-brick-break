// Field geometry. Logical size of the play area in pixels.
export const W = 390;
export const H = 844;
export const PLAY_TOP = 84;
export const BOWL_Y = 760;
export const BALL_R = 4.2;
export const TILE_RC = 7.7; // collision radius of a hex tile
export const COLS = 25;
export const ROWS = 34;
export const DX = 14.55;
export const DY = 12.6;
export const X0 = (W - (24 * DX + DX / 2)) / 2;
export const Y0 = 116;
export const DT = 1 / 120;
export const TPS = 120;
export const MAX_BALLS = 260;

export const enum Kind { Plain = 0, Prism2 = 2, Prism3 = 3, Prism5 = 5 }
export const enum Pu { None = 0, Wide = 1, Pierce = 2, Echo = 3, Net = 4, Triple = 5 }

/** One tile in a stage. c/r are grid column and row. */
export interface TileDef {
  c: number;
  r: number;
  hp: number;
  kind: number;
  pu: number;
}

export interface LevelDef {
  id: number;
  name: string;
  world: number;
  tier: string;
  seed: number;
  speed: number;
  bowlW: number;
  lives: number;
  driftAmp: number;
  driftTicks: number;
  par: number;
  tiles: TileDef[];
}

export type InputLog = Array<[number, number, number]>;

export interface Input {
  x: number;
  launch: boolean;
}

export interface GameEvent {
  t: 'break' | 'hit' | 'prism' | 'bowl' | 'token' | 'life' | 'win' | 'lose' | 'launch';
  x: number;
  y: number;
  n?: number;
}
