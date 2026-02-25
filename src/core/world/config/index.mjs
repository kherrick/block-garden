import { Signal } from "signal-polyfill";

import { blockNames, blocks } from "./blocks.mjs";

export const FAST_GROWTH_TIME = 15;

/**
 * @typedef {import('./blocks.mjs').Blocks} Blocks
 */

/**
 * Game configuration store.
 *
 * @typedef {Object} GameConfig
 *
 * @property {Object} blockNames - Names of all blocks
 * @property {Blocks} blocks - All block definitions
 * @property {Signal.State<number>} cacheRadius
 * @property {Signal.State<number>} caveThreshold - Cave generation threshold state
 * @property {Signal.State<number>} cloudDensity
 * @property {Signal.State<string>} currentResolution - Signal State for current resolution
 * @property {Signal.State<number>} decorationDensity
 * @property {Signal.State<boolean>} linkGameSave
 * @property {Signal.State<number>} mountainScale
 * @property {Signal.State<number>} renderRadius
 * @property {Signal.State<number>} terrainOctaves
 * @property {Signal.State<boolean>} useAmbientOcclusion
 * @property {Signal.State<boolean>} useAODebug
 * @property {Signal.State<boolean>} useAutoJump - Auto jump toggle state
 * @property {Signal.State<boolean>} useBlockHighlight - Block highlight toggle state
 * @property {Signal.State<boolean>} useCaves
 * @property {Signal.State<boolean>} useCreativeMode - Creative mode toggle (unlimited resources)
 * @property {Signal.State<boolean>} useDamageAnimation - Damage animation toggle state
 * @property {Signal.State<boolean>} useDynamicLighting
 * @property {Signal.State<boolean>} usePerFaceLighting
 * @property {Signal.State<boolean>} useSplitControls - Use split controls toggle state
 * @property {Signal.State<boolean>} useTextureAtlas
 * @property {Signal.State<boolean>} useTouchControls - Use touch controls toggle state
 * @property {Signal.State<string>} version - Signal State for game version string
 * @property {Signal.State<number>} viewRadius
 * @property {Signal.State<number>} worldRadius
 * @property {Signal.State<number>} dayLength - Full day/night cycle duration in seconds (default 1200)
 * @property {Signal.State<number>} timeScale - Multiplier for time progression (default 1.0)
 * @property {Signal.State<boolean>} useFastMovement - Enable fast flying
 * @property {Signal.State<boolean>} useTimeCycle - Enable day/night cycle (default true)
 * @property {Signal.State<number>} manualTimeOfDay - Manual sun position override when cycle disabled (0-1, default 0.5 = noon)
 * @property {Signal.State<boolean>} useCelestialBodies - Enable visible sun/moon in sky (default true)
 * @property {Signal.State<boolean>} useMoonlight - Enable moonlight at night (default true)
 * @property {Signal.State<boolean>} showFullCatalog - Show all items in inventory even if 0 (default true)
 * @property {Signal.State<boolean>} useSolidClouds - Whether clouds are solid/walkable (default true)
 * @property {Signal.State<boolean>} useTexturedWater - Whether water blocks use texture (default false)
 * @property {Signal.State<boolean>} useOreLocator - Ore locator feature toggle (default false)
 * @property {Signal.State<number>} oreLocatorRadius - Ore scan radius in blocks (default 32)
 */

export const CONFIG_DEFAULTS = {
  CACHE_RADIUS: 4,
  CAVE_THRESHOLD: 50,
  CLOUD_DENSITY: 20,
  CURRENT_RESOLUTION: "600",
  DAY_LENGTH: 1200,
  DECORATION_DENSITY: 40,
  LINK_GAME_SAVE: false,
  MANUAL_TIME_OF_DAY: 0.5,
  MOUNTAIN_SCALE: 75,
  RENDER_RADIUS: 4,
  SHOW_FULL_CATALOG: false,
  TERRAIN_OCTAVES: 2,
  TIME_SCALE: 1.0,
  USE_AMBIENT_OCCLUSION: true,
  USE_AO_DEBUG: false,
  USE_AUTO_JUMP: true,
  USE_BLOCK_HIGHLIGHT: true,
  USE_CAVES: true,
  USE_CELESTIAL_BODIES: true,
  USE_CREATIVE_MODE: false,
  USE_DAMAGE_ANIMATION: true,
  USE_DYNAMIC_LIGHTING: true,
  USE_MOONLIGHT: true,
  USE_FAST_MOVEMENT: false,
  USE_PER_FACE_LIGHTING: true,
  USE_SPLIT_CONTROLS: false,
  USE_SOLID_CLOUDS: true,
  USE_TEXTURE_ATLAS: true,
  USE_TEXTURED_WATER: true,
  USE_TIME_CYCLE: false,
  USE_TOUCH_CONTROLS: true,
  USE_ORE_LOCATOR: false,
  ORE_LOCATOR_RADIUS: 32,
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
  useCreativeMode: new Signal.State(CONFIG_DEFAULTS.USE_CREATIVE_MODE),
  useDamageAnimation: new Signal.State(CONFIG_DEFAULTS.USE_DAMAGE_ANIMATION),
  useDynamicLighting: new Signal.State(CONFIG_DEFAULTS.USE_DYNAMIC_LIGHTING),
  useFastMovement: new Signal.State(CONFIG_DEFAULTS.USE_FAST_MOVEMENT),
  useMoonlight: new Signal.State(CONFIG_DEFAULTS.USE_MOONLIGHT),
  usePerFaceLighting: new Signal.State(CONFIG_DEFAULTS.USE_PER_FACE_LIGHTING),
  useSplitControls: new Signal.State(CONFIG_DEFAULTS.USE_SPLIT_CONTROLS),
  useSolidClouds: new Signal.State(CONFIG_DEFAULTS.USE_SOLID_CLOUDS),
  useTextureAtlas: new Signal.State(CONFIG_DEFAULTS.USE_TEXTURE_ATLAS),
  useTexturedWater: new Signal.State(CONFIG_DEFAULTS.USE_TEXTURED_WATER),
  useTimeCycle: new Signal.State(CONFIG_DEFAULTS.USE_TIME_CYCLE),
  useTouchControls: new Signal.State(CONFIG_DEFAULTS.USE_TOUCH_CONTROLS),
  useOreLocator: new Signal.State(CONFIG_DEFAULTS.USE_ORE_LOCATOR),
  oreLocatorRadius: new Signal.State(CONFIG_DEFAULTS.ORE_LOCATOR_RADIUS),
  version: new Signal.State(CONFIG_DEFAULTS.VERSION),
  viewRadius: new Signal.State(CONFIG_DEFAULTS.VIEW_RADIUS),
  worldRadius: new Signal.State(CONFIG_DEFAULTS.WORLD_RADIUS),
  showFullCatalog: new Signal.State(CONFIG_DEFAULTS.SHOW_FULL_CATALOG),
};
