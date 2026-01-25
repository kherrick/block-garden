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
    { time: 0.25, color: SKY_COLORS.dawn },
    { time: 0.35, color: SKY_COLORS.morning },
    { time: 0.5, color: SKY_COLORS.noon },
    { time: 0.65, color: SKY_COLORS.afternoon },
    { time: 0.75, color: SKY_COLORS.dusk },
    { time: 0.85, color: SKY_COLORS.eveningDark },
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
    { time: 0.25, light: AMBIENT_LIGHT.dawn },
    { time: 0.35, light: AMBIENT_LIGHT.morning },
    { time: 0.5, light: AMBIENT_LIGHT.noon },
    { time: 0.65, light: AMBIENT_LIGHT.afternoon },
    { time: 0.75, light: AMBIENT_LIGHT.dusk },
    { time: 0.85, light: AMBIENT_LIGHT.eveningDark },
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
 * Sun rises in the east at dawn (0.25), peaks at zenith at noon (0.5),
 * and sets in the west at dusk (0.75).
 *
 * @param {number} normalizedTime - Normalized time (0–1)
 *
 * @returns {{x: number, y: number, z: number}} Directional light vector
 */
export function getSunDirection(normalizedTime) {
  const time = normalizeTime(normalizedTime);

  // Phase-shifted angle so sun peaks at noon (time=0.5)
  // At dawn (0.25): angle = 0, height = 0 (rising)
  // At noon (0.5): angle = PI/2, height = 1 (peak)
  // At dusk (0.75): angle = PI, height = 0 (setting)
  // At midnight (0 or 1): angle = -PI/2 or 3PI/2, height = -1 (below)
  const angle = (time - 0.25) * Math.PI * 2;

  // Compute height: peaks at noon, nadir at midnight
  let height = Math.sin(angle);

  // Clamp height to prevent sun from going too far below horizon at night
  // This keeps some ambient moonlight
  height = Math.max(height, -0.3);

  // Horizontal movement: sun traces an arc from east (+X) to west (-X)
  // At dawn: x = 1 (east), z = 0
  // At noon: x = 0, z = 0 (overhead, horizontal doesn't matter as much)
  // At dusk: x = -1 (west), z = 0
  const x = Math.cos(angle);
  const y = height;
  const z = 0; // Sun moves in XY plane for simplicity

  // Normalize the vector
  const length = Math.sqrt(x * x + y * y + z * z);

  return {
    x: x / length,
    y: y / length,
    z: z / length,
  };
}

/**
 * Get the world-space position direction for a celestial body.
 * Sun and moon are on opposite sides of the sky.
 *
 * @param {number} normalizedTime - Normalized time (0–1)
 * @param {boolean} isSun - True for sun, false for moon
 *
 * @returns {{x: number, y: number, z: number}} Unit direction vector to celestial body
 */
export function getCelestialPosition(normalizedTime, isSun = true) {
  const time = normalizeTime(normalizedTime);

  // Phase-shifted angle so sun peaks at noon (time=0.5)
  // Sun: peaks at 0.5., Moon: peaks at 0.0 (opposite)
  const baseAngle = (time - 0.25) * Math.PI * 2;

  // Moon is opposite the sun (offset by PI)
  const angle = isSun ? baseAngle : baseAngle + Math.PI;

  // Height follows a sinusoidal arc
  // Sun at noon (0.5): angle = PI/2, sin = 1 (peak)
  // Moon at midnight (0): angle = PI/2, sin = 1 (peak)
  const height = Math.sin(angle);

  // Horizontal position: traces arc from east (+X) to west (-X)
  const x = Math.cos(angle);
  const z = 0; // Move in XY plane for simplicity

  // Normalize the direction
  const length = Math.sqrt(x * x + height * height + z * z);

  return {
    x: x / length,
    y: height / length,
    z: z / length,
  };
}

/**
 * Get visibility factor for a celestial body (0 = hidden, 1 = fully visible).
 * Includes horizon fade effect with extended twilight visibility.
 *
 * @param {number} normalizedTime - Normalized time (0–1)
 * @param {boolean} isSun - True for sun, false for moon
 *
 * @returns {number} Visibility factor (0–1)
 */
export function getCelestialVisibility(normalizedTime, isSun = true) {
  const pos = getCelestialPosition(normalizedTime, isSun);

  // Extended visibility range for realistic twilight effect
  // Account for horizon dip at altitude by being more generous on the CPU-side check
  const HORIZON_FADE_START = -1.1; // Broaden CPU check to allow horizon dip
  const HORIZON_FADE_END = 0.3; // Fully visible higher up

  if (pos.y <= HORIZON_FADE_START) {
    return 0; // Fully below horizon
  }

  if (pos.y >= HORIZON_FADE_END) {
    return 1; // Fully visible
  }

  // Smooth transition near horizon
  const t =
    (pos.y - HORIZON_FADE_START) / (HORIZON_FADE_END - HORIZON_FADE_START);

  // Use smoothstep for natural easing
  return t * t * (3 - 2 * t);
}

/**
 * Get moon light direction (for night lighting).
 * Moon provides dim, cool-toned illumination when sun is below horizon.
 *
 * @param {number} normalizedTime - Normalized time (0–1)
 *
 * @returns {{x: number, y: number, z: number}} Moon light direction vector
 */
export function getMoonDirection(normalizedTime) {
  const moonPos = getCelestialPosition(normalizedTime, false);

  // Invert direction (light comes FROM the moon)
  return {
    x: -moonPos.x,
    y: -moonPos.y,
    z: -moonPos.z,
  };
}

/**
 * Get moonlight intensity based on moon visibility.
 * Returns 0 during day, ramps up at night.
 *
 * @param {number} normalizedTime - Normalized time (0–1)
 *
 * @returns {number} Moonlight intensity (0–1)
 */
export function getMoonlightIntensity(normalizedTime) {
  const sunVis = getCelestialVisibility(normalizedTime, true);
  const moonVis = getCelestialVisibility(normalizedTime, false);

  // During twilight, blend based on relative visibility
  // When sun is still visible, moonlight is reduced
  const sunFactor = 1 - sunVis;

  // Scale moonlight by moon visibility and inverse sun visibility
  // Moonlight is dimmer than sunlight (max ~0.3 intensity)
  return moonVis * sunFactor * 0.3;
}

/**
 * Get blended light direction and intensity for smooth day/night transitions.
 * Interpolates between sunlight and moonlight during twilight periods.
 * Uses angular interpolation to avoid vector collapse (the "flash" issue).
 *
 * @param {number} normalizedTime - Normalized time (0–1)
 *
 * @returns {{x: number, y: number, z: number, intensity: number}} Light direction and intensity
 */
export function getBlendedLightDirection(normalizedTime) {
  const time = normalizeTime(normalizedTime);
  const sunVis = getCelestialVisibility(time, true);
  const moonVis = getCelestialVisibility(time, false);

  // Transition factor: 1.0 (pure Sun) to 0.0 (pure Moon)
  const totalVis = sunVis + moonVis;
  let sunWeight = 1.0;

  if (totalVis > 0.001) {
    sunWeight = sunVis / totalVis;
  }

  // Calculate base angle for the sun (0 at dawn, PI/2 at noon)
  const sunAngle = (time - 0.25) * Math.PI * 2;
  // Moon is opposite (offset by PI)
  // Light from moon is also opposite to moon's position
  // moonPos = (cos(A+PI), sin(A+PI)), moonDir = -moonPos = (cos(A), sin(A))
  // sunDir (to sun) = (cos(A), sin(A)), lightFromSun = -sunDir = (-cos(A), -sin(A))
  // Wait, sunAngle above is the angle TO the sun.
  // We need light FROM the sun: sunAngle + PI.

  const lightFromSunAngle = sunAngle + Math.PI;
  const lightFromMoonAngle = sunAngle; // Opposite of moonPos (sunAngle + PI)

  // Blending the angles avoids zero-length vectors
  // Since they are opposite, linear vector blend collapses at midpoint.
  // Instead, we interpolate the angle on the unit circle.

  // Use a faster transition for direction to feel more like one source is taking over
  const dirWeight = sunWeight * sunWeight * (3 - 2 * sunWeight); // Smoothstep the weight

  // Interpolate angle: from moon-light-angle to sun-light-angle
  // Since they are always PI apart, this is a 180-degree rotation.
  const blendedAngle = lightFromMoonAngle + dirWeight * Math.PI;

  const x = Math.cos(blendedAngle);
  const y = Math.sin(blendedAngle);

  // Blend intensity: sun is full brightness, moon is ~30%
  const intensity = sunVis * 1.0 + moonVis * 0.3 * (1 - sunVis);

  return {
    x,
    y,
    z: 0,
    intensity: Math.max(intensity, 0.1), // Minimum ambient
  };
}
