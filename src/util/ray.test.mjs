import { ray } from "./ray.mjs";

describe("ray()", () => {
  // Mock world that has blocks at specific coordinates
  const mockWorld = {
    blocks: new Set(["2,0,5", "3,0,5", "2,1,5"]),
    has(key) {
      return this.blocks.has(key);
    },
  };

  it("should hit a block directly in front", () => {
    // Player at 2.5, 0.5, 0.5 looking at +Z (yaw=0, pitch=0)
    // Block at 2,0,5
    // Wait, +Z is yaw=0?
    // In ray.mjs:
    // dx = sin(yaw) * cos(pitch)
    // dz = cos(yaw) * cos(pitch)
    // If yaw=0, dx=0, dz=1. So +Z is forward.

    const start = { x: 2.5, y: 0.5, z: 0.5 };
    const rotation = { yaw: 0, pitch: 0 };

    // Default max distance is 16.
    // Ray: x=2.5, y=0.5, z increases.
    // Should hit 2,0,5.

    const hit = ray(mockWorld, start, rotation);

    expect(hit.x).toBe(2);
    expect(hit.y).toBe(0);
    expect(hit.z).toBe(5);
    // Face should be -Z (0, 0, -1) because we hit the "front" face coming from -Z
    expect(hit.face).toEqual({ x: 0, y: 0, z: -1 });
  });

  it("should return the correct face when hitting from the side", () => {
    // Player at 0.5, 0.5, 5.5 looking at +X (yaw=PI/2)
    // Block at 2,0,5

    const start = { x: 0.5, y: 0.5, z: 5.5 };
    const rotation = { yaw: Math.PI / 2, pitch: 0 };

    const hit = ray(mockWorld, start, rotation);

    expect(hit.x).toBe(2);
    expect(hit.y).toBe(0);
    // z=5
    expect(hit.z).toBe(5);
    // Face should be -X (-1, 0, 0)
    expect(hit.face).toEqual({ x: -1, y: 0, z: 0 });
  });

  it("should hit top face when looking down", () => {
    // Block at 2,1,5
    // Player above it at 2.5, 3.5, 5.5

    const start = { x: 2.5, y: 3.5, z: 5.5 };
    // Look straight down: pitch = -PI/2 ?
    // In ray.mjs: dy = sin(pitch).
    // If we want dy = -1 (down), pitch should be -PI/2.
    // wait, coordinate system in gameLoop:
    // pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, ...))
    // down is -PI/2?
    // let's check ray.mjs logic again:
    // dy = sin(pitch)
    // if pitch is negative, dy is negative. y decreases.

    const rotation = { yaw: 0, pitch: -Math.PI / 2 + 0.1 }; // Nearly straight down

    const hit = ray(mockWorld, start, rotation);

    // Should hit 2,1,5
    expect(hit.x).toBe(2);
    expect(hit.y).toBe(1);
    expect(hit.z).toBe(5);
    // Face should be +Y (0, 1, 0) (Top face)
    expect(hit.face).toEqual({ x: 0, y: 1, z: 0 });
  });
  it("should handle grazing shots correctly", () => {
    // Block at 2,0,5. Top face y=1. Front edge at x=2.
    // Player at 0, 1.62, 5.
    // Vertical drop to top edge: 1.62 - 1.0 = 0.62.
    // Horizontal dist to front edge: 2.0.
    // Critical slope = -0.62 / 2.0 = -0.31.
    // Critical Pitch = atan(-0.31).

    const start = { x: 0, y: 1.62, z: 5 };

    // Case A: Shallow Angle (Aiming Above). Should MISS the block (fly over).
    // Slope -0.25.
    // pitch approx -14 deg.
    const pitchHigh = Math.atan(-0.25);
    const hitHigh = ray(mockWorld, start, {
      yaw: Math.PI / 2,
      pitch: pitchHigh,
    });

    // Ray should pass over (2,0,5).
    // might hit (2,1,5) (Air).
    // If it hits (2,1,5), face would be X=-1 (Front).
    // Or if (2,1,5) is AIR, it continues.
    // Assuming mockWorld defines "2,1,5" as a block?
    // "blocks: new Set(["2,0,5", "3,0,5", "2,1,5"])".
    // Yes, 2,1,5 IS a block in this mock.
    // So we SHOULD hit (2,1,5) Front Face.

    expect(hitHigh.x).toBe(2);
    expect(hitHigh.y).toBe(1);
    expect(hitHigh.face).toEqual({ x: -1, y: 0, z: 0 });

    // Case B: Steep Angle (Aiming At Top Face). Should HIT Top Face.
    // Slope -0.40. (Steeper than -0.31).
    // But verify geometry:
    // At x=2, y = 1.62 - 0.8 = 0.82.
    // 0.82 < 1.0.
    // So we hit the X=2 plane BELOW y=1.
    // So we enter (2, 0, 5) from the SIDE (X=-1).
    // Wait.
    // To hit Top Face, we must enter via Y=1 plane.
    // This happens if we cross Y=1 BEFORE X=2?
    // No, we start at x=0. Block starts x=2.
    // We arrive at x=2. We are at y=0.82.
    // We hit the SIDE.

    // To hit Top Face, we must be ABOVE 1.0 at x=2.
    // AND collide with Top Face later?
    // If we are above 1.0 at x=2. We enter (2,1,5).
    // If (2,1,5) is SOLID (it is in mock). We hit (2,1,5) Side.
    // If (2,1,5) was AIR. We enter (2,1,5).
    // Then we traverse down. Hit (2,0,5) Top.

    // Let's REMOVE (2,1,5) from mock to test "Hit Top Face".
    mockWorld.blocks.delete("2,1,5");

    // Now (2,1,5) is Air.
    // A slope that clears the corner (Shallow, e.g. -0.25) -> Goes over (2,0,5). Misses.
    // A slope that hits Side (Steep, e.g. -0.40) -> Hits Side.
    // A slope that hits Top?
    // To hit Top, we must enter (2,1,5) (Above corner), then cross Y=1 boundary.
    // At x=2, y > 1. (Slope > -0.31).
    // But we need to hit Y=1 before hitting X=3 (Back of block).
    // slope -0.30.
    // At x=2, y=1.02.
    // At x=3, y = 1.02 - 0.30 = 0.72.
    // We cross Y=1 between x=2 and x=3.
    // So we Hit Top Face.

    // So Slope -0.30 (Shallow-ish) hits Top Face.

    const pitchTop = Math.atan(-0.3);
    const hitTop = ray(mockWorld, start, { yaw: Math.PI / 2, pitch: pitchTop });

    expect(hitTop.x).toBe(2);
    expect(hitTop.y).toBe(0);
    expect(hitTop.face).toEqual({ x: 0, y: 1, z: 0 }); // Top Face
  });
});
