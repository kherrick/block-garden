import { Signal } from "signal-polyfill";

import { blockNames, blocks } from "./blocks.mjs";

export const FAST_GROWTH_TIME = 30;

/**
 * @typedef {import('./blocks.mjs').BlockArray} BlockArray
 */

/**
 * Game configuration store.
 *
 * @typedef {Object} GameConfig
 *
 * @property {Object} blockNames - Names of all blocks
 * @property {BlockArray} blocks - All block definitions
 * @property {Signal.State} cacheRadius
 * @property {Signal.State} caveThreshold - Cave generation threshold state
 * @property {Signal.State} cloudDensity
 * @property {Signal.State} currentResolution - Signal State for current resolution
 * @property {Signal.State} decorationDensity
 * @property {Signal.State} linkGameSave
 * @property {Signal.State} mountainScale
 * @property {Signal.State} renderRadius
 * @property {Signal.State} terrainOctaves
 * @property {Signal.State} useAmbientOcclusion
 * @property {Signal.State} useAODebug
 * @property {Signal.State} useAutoJump - Auto jump toggle state
 * @property {Signal.State} useBlockHighlight - Block highlight toggle state
 * @property {Signal.State} useCaves
 * @property {Signal.State} useDamageAnimation - Damage animation toggle state
 * @property {Signal.State} useDynamicLighting
 * @property {Signal.State} usePerFaceLighting
 * @property {Signal.State} useSplitControls - Use split controls toggle state
 * @property {Signal.State} useTextureAtlas
 * @property {Signal.State} useTouchControls - Use touch controls toggle state
 * @property {Signal.State} version - Signal State for game version string
 * @property {Signal.State} viewRadius
 * @property {Signal.State} worldRadius
 * @property {Signal.State} dayLength - Full day/night cycle duration in seconds (default 1200)
 * @property {Signal.State} timeScale - Multiplier for time progression (default 1.0)
 * @property {Signal.State} useTimeCycle - Enable day/night cycle (default true)
 * @property {Signal.State} manualTimeOfDay - Manual sun position override when cycle disabled (0-1, default 0.5 = noon)
 * @property {Signal.State} useCelestialBodies - Enable visible sun/moon in sky (default true)
 * @property {Signal.State} useMoonlight - Enable moonlight at night (default true)
 */

export const CONFIG_DEFAULTS = {
  CACHE_RADIUS: 4,
  CAVE_THRESHOLD: 80,
  CLOUD_DENSITY: 20,
  CURRENT_RESOLUTION: "600",
  DAY_LENGTH: 1200,
  DECORATION_DENSITY: 40,
  LINK_GAME_SAVE: false,
  MANUAL_TIME_OF_DAY: 0.5,
  MOUNTAIN_SCALE: 25,
  RENDER_RADIUS: 4,
  TERRAIN_OCTAVES: 2,
  TIME_SCALE: 1.0,
  USE_AMBIENT_OCCLUSION: false,
  USE_AO_DEBUG: false,
  USE_AUTO_JUMP: true,
  USE_BLOCK_HIGHLIGHT: true,
  USE_CAVES: true,
  USE_CELESTIAL_BODIES: true,
  USE_DAMAGE_ANIMATION: true,
  USE_DYNAMIC_LIGHTING: true,
  USE_MOONLIGHT: true,
  USE_PER_FACE_LIGHTING: true,
  USE_SPLIT_CONTROLS: false,
  USE_TEXTURE_ATLAS: false,
  USE_TIME_CYCLE: false,
  USE_TOUCH_CONTROLS: true,
  VERSION: "1",
  VIEW_RADIUS: 128,
  WORLD_RADIUS: 384,
};

/**
 * Global game configuration and constants.
 *
 * @type {GameConfig}
 *
 * @constant
 */
export const gameConfig = {
  blockNames,
  blocks,
  cacheRadius: new Signal.State(CONFIG_DEFAULTS.CACHE_RADIUS),
  caveThreshold: new Signal.State(CONFIG_DEFAULTS.CAVE_THRESHOLD),
  cloudDensity: new Signal.State(CONFIG_DEFAULTS.CLOUD_DENSITY),
  currentResolution: new Signal.State(CONFIG_DEFAULTS.CURRENT_RESOLUTION),
  dayLength: new Signal.State(CONFIG_DEFAULTS.DAY_LENGTH),
  decorationDensity: new Signal.State(CONFIG_DEFAULTS.DECORATION_DENSITY),
  linkGameSave: new Signal.State(CONFIG_DEFAULTS.LINK_GAME_SAVE),
  manualTimeOfDay: new Signal.State(CONFIG_DEFAULTS.MANUAL_TIME_OF_DAY),
  mountainScale: new Signal.State(CONFIG_DEFAULTS.MOUNTAIN_SCALE),
  renderRadius: new Signal.State(CONFIG_DEFAULTS.RENDER_RADIUS),
  terrainOctaves: new Signal.State(CONFIG_DEFAULTS.TERRAIN_OCTAVES),
  timeScale: new Signal.State(CONFIG_DEFAULTS.TIME_SCALE),
  useAmbientOcclusion: new Signal.State(CONFIG_DEFAULTS.USE_AMBIENT_OCCLUSION),
  useAODebug: new Signal.State(CONFIG_DEFAULTS.USE_AO_DEBUG),
  useAutoJump: new Signal.State(CONFIG_DEFAULTS.USE_AUTO_JUMP),
  useBlockHighlight: new Signal.State(CONFIG_DEFAULTS.USE_BLOCK_HIGHLIGHT),
  useCaves: new Signal.State(CONFIG_DEFAULTS.USE_CAVES),
  useCelestialBodies: new Signal.State(CONFIG_DEFAULTS.USE_CELESTIAL_BODIES),
  useDamageAnimation: new Signal.State(CONFIG_DEFAULTS.USE_DAMAGE_ANIMATION),
  useDynamicLighting: new Signal.State(CONFIG_DEFAULTS.USE_DYNAMIC_LIGHTING),
  useMoonlight: new Signal.State(CONFIG_DEFAULTS.USE_MOONLIGHT),
  usePerFaceLighting: new Signal.State(CONFIG_DEFAULTS.USE_PER_FACE_LIGHTING),
  useSplitControls: new Signal.State(CONFIG_DEFAULTS.USE_SPLIT_CONTROLS),
  useTextureAtlas: new Signal.State(CONFIG_DEFAULTS.USE_TEXTURE_ATLAS),
  useTimeCycle: new Signal.State(CONFIG_DEFAULTS.USE_TIME_CYCLE),
  useTouchControls: new Signal.State(CONFIG_DEFAULTS.USE_TOUCH_CONTROLS),
  version: new Signal.State(CONFIG_DEFAULTS.VERSION),
  viewRadius: new Signal.State(CONFIG_DEFAULTS.VIEW_RADIUS),
  worldRadius: new Signal.State(CONFIG_DEFAULTS.WORLD_RADIUS),
};
