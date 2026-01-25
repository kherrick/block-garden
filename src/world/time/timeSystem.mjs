/**
 * World time system for day/night cycles.
 * Manages world time progression, normalization, and sky color computation.
 *
 * Time is stored as a normalized value (0–1) where:
 * - 0.0 = Midnight (00:00)
 * - 0.25 = Dawn (06:00)
 * - 0.5 = Noon (12:00)
 * - 0.75 = Dusk (18:00)
 */

/**
 * Sky color palette for different times of day.
 * Indexed by time of day (0–1) for interpolation.
 *
 * @type {Object<string, [number, number, number, number]>} Color as [R, G, B, A]
 */
const SKY_COLORS = {
  midnight: [0.05, 0.05, 0.15, 1.0], // Deep night blue
  earlyMorning: [0.1, 0.15, 0.4, 1.0], // Dark blue before dawn
  dawn: [0.3, 0.5, 0.8, 1.0], // Soft orange-blue gradient
  morning: [0.6, 0.8, 1.0, 1.0], // Light blue
  noon: [0.7, 0.9, 1.0, 1.0], // Bright blue
  afternoon: [0.7, 0.85, 1.0, 1.0], // Slightly warmer
  dusk: [0.8, 0.6, 0.3, 1.0], // Orange-red gradient
  eveningDark: [0.2, 0.15, 0.4, 1.0], // Dark blue after sunset
};

/**
 * Ambient light intensity for different times of day.
 * Affects the brightness of the world.
 *
 * @type {Object<string, number>}
 */
const AMBIENT_LIGHT = {
  midnight: 0.2, // Very dim
  earlyMorning: 0.25,
  dawn: 0.4, // Ramping up
  morning: 0.65,
  noon: 1.0, // Brightest
  afternoon: 0.9,
  dusk: 0.5, // Ramping down
  eveningDark: 0.3, // Getting darker
};

/**
 * Get the current time of day as a human-readable string.
 *
 * @param {number} normalizedTime - Normalized time (0–1)
 *
 * @returns {string} Time as "HH:MM" format
 */
export function getNormalizedTimeAsString(normalizedTime) {
  const hours = Math.floor(normalizedTime * 24);
  const minutes = Math.floor((normalizedTime * 24 - hours) * 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Normalize time to 0–1 range (wraps around at 1.0).
 *
 * @param {number} time - Raw time value (can be any number)
 * @returns {number} Normalized time (0–1)
 */
export function normalizeTime(time) {
  return ((time % 1.0) + 1.0) % 1.0;
}

/**
 * Interpolate between two RGBA colors.
 *
 * @param {[number, number, number, number]} color1 - First color [R, G, B, A]
 * @param {[number, number, number, number]} color2 - Second color [R, G, B, A]
 * @param {number} t - Interpolation factor (0–1)
 *
 * @returns {[number, number, number, number]} Interpolated color
 */
function interpolateColor(color1, color2, t) {
  return [
    color1[0] + (color2[0] - color1[0]) * t,
    color1[1] + (color2[1] - color1[1]) * t,
    color1[2] + (color2[2] - color1[2]) * t,
    color1[3] + (color2[3] - color1[3]) * t,
  ];
}

/**
 * Get sky color for a given normalized time.
 * Smoothly interpolates between key colors throughout the day.
 *
 * @param {number} normalizedTime - Normalized time (0–1)
 *
 * @returns {[number, number, number, number]} RGBA sky color
 */
export function getSkyColor(normalizedTime) {
  const time = normalizeTime(normalizedTime);

  // Define key time points and their colors
  const keyTimes = [
    { time: 0.0, color: SKY_COLORS.midnight },
    { time: 0.2, color: SKY_COLORS.earlyMorning },
    { time: 0.35, color: SKY_COLORS.dawn },
    { time: 0.45, color: SKY_COLORS.morning },
    { time: 0.5, color: SKY_COLORS.noon },
    { time: 0.55, color: SKY_COLORS.afternoon },
    { time: 0.65, color: SKY_COLORS.dusk },
    { time: 0.8, color: SKY_COLORS.eveningDark },
    { time: 1.0, color: SKY_COLORS.midnight },
  ];

  // Find the two key times to interpolate between
  for (let i = 0; i < keyTimes.length - 1; i++) {
    const t1 = keyTimes[i];
    const t2 = keyTimes[i + 1];

    if (time >= t1.time && time <= t2.time) {
      // Interpolate between t1 and t2
      const localT = (time - t1.time) / (t2.time - t1.time);

      return interpolateColor(t1.color, t2.color, localT);
    }
  }

  // Fallback (shouldn't reach here if time is normalized)
  return SKY_COLORS.midnight;
}

/**
 * Get ambient light intensity for a given normalized time.
 *
 * @param {number} normalizedTime - Normalized time (0–1)
 *
 * @returns {number} Ambient light intensity (0–1)
 */
export function getAmbientLight(normalizedTime) {
  const time = normalizeTime(normalizedTime);

  // Define key time points and their ambient light levels
  const keyTimes = [
    { time: 0.0, light: AMBIENT_LIGHT.midnight },
    { time: 0.2, light: AMBIENT_LIGHT.earlyMorning },
    { time: 0.35, light: AMBIENT_LIGHT.dawn },
    { time: 0.45, light: AMBIENT_LIGHT.morning },
    { time: 0.5, light: AMBIENT_LIGHT.noon },
    { time: 0.55, light: AMBIENT_LIGHT.afternoon },
    { time: 0.65, light: AMBIENT_LIGHT.dusk },
    { time: 0.8, light: AMBIENT_LIGHT.eveningDark },
    { time: 1.0, light: AMBIENT_LIGHT.midnight },
  ];

  // Find the two key times to interpolate between
  for (let i = 0; i < keyTimes.length - 1; i++) {
    const t1 = keyTimes[i];
    const t2 = keyTimes[i + 1];

    if (time >= t1.time && time <= t2.time) {
      // Linear interpolation
      const localT = (time - t1.time) / (t2.time - t1.time);

      return t1.light + (t2.light - t1.light) * localT;
    }
  }

  // Fallback
  return AMBIENT_LIGHT.midnight;
}

/**
 * Compute directional light vector (sun position) from time.
 * Sun starts in the east (positive X) at dawn, peaks at zenith at noon,
 * and sets in the west (negative X) at dusk.
 *
 * @param {number} normalizedTime - Normalized time (0–1)
 *
 * @returns {{x: number, y: number, z: number}} Directional light vector
 */
export function getSunDirection(normalizedTime) {
  const time = normalizeTime(normalizedTime);

  // Sun angle: 0 at midnight (behind), PI at noon (front), 2*PI at next midnight
  // We want sun to rise from east (positive X) and set in west (negative X)
  const angle = time * Math.PI * 2;

  // Sun moves from east to west across the sky
  // At dawn (0.25): angle = PI/2, sun on eastern horizon
  // At noon (0.5): angle = PI, sun directly overhead
  // At dusk (0.75): angle = 3PI/2, sun on western horizon
  // At midnight (0 or 1): angle = 0 or 2PI, sun below ground

  // Compute height: peaks at noon, low at midnight
  // Use sine to smooth the arc
  let height = Math.sin(angle);

  // Clamp height to prevent sun from going too far below horizon at night
  // This keeps some ambient moonlight
  height = Math.max(height, -0.3);

  // Horizontal angle: east to west
  const horizontalAngle = angle - Math.PI / 2; // Shift so sun starts from east

  const x = Math.cos(horizontalAngle);
  const y = height;
  const z = Math.sin(horizontalAngle);

  // Normalize the vector
  const length = Math.sqrt(x * x + y * y + z * z);

  return {
    x: x / length,
    y: y / length,
    z: z / length,
  };
}
