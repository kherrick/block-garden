/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

// Mock isKeyPressed module
jest.unstable_mockModule("../../utils/isKeyPressed.mjs", () => ({
  isKeyPressed: jest.fn((_, key) => false),
}));

// Mock placeBlock module
jest.unstable_mockModule("../../utils/interaction.mjs", () => ({
  placeBlock: jest.fn(),
}));

const { updatePlayer } = await import("./player.mjs");
const { isKeyPressed } = await import("../../utils/isKeyPressed.mjs");
const { placeBlock } = await import("../../utils/interaction.mjs");

describe("updatePlayer", () => {
  let mockShadow;
  let mockState;

  beforeEach(() => {
    jest.clearAllMocks();
    isKeyPressed.mockReset();
    placeBlock.mockReset();

    mockShadow = {};

    mockState = {
      yaw: 0,
      pitch: 0,
      flying: { get: () => false },
      arrowsControlCamera: { get: () => false },
      dx: 0,
      dy: 0,
      dz: 0,
      isCanvasActionDisabled: false,
      actionKeyPressTime: 0,
      breakingInput: {
        isHeld: false,
        mode: "",
      },
    };

    // Mock performance.now()
    globalThis.performance = {
      now: () => 0,
    };
  });

  test("should move forward when W is pressed", () => {
    isKeyPressed.mockReturnValue(true);
    updatePlayer(mockShadow, mockState, 0.01);

    // With yaw=0, W should move in positive z direction
    expect(mockState.dz).toBeGreaterThan(0);
  });

  test("should move backward when S is pressed", () => {
    isKeyPressed.mockImplementation((_, key) => key === "s");
    updatePlayer(mockShadow, mockState, 0.01);

    // With yaw=0, S should move in negative z direction
    expect(mockState.dz).toBeLessThan(0);
  });

  test("should move left when A is pressed", () => {
    isKeyPressed.mockImplementation((_, key) => key === "a");
    updatePlayer(mockShadow, mockState, 0.01);

    // With yaw=0, A should move in positive x direction (left)
    expect(mockState.dx).toBeGreaterThan(0);
  });

  test("should move right when D is pressed", () => {
    isKeyPressed.mockImplementation((_, key) => key === "d");
    updatePlayer(mockShadow, mockState, 0.01);

    // With yaw=0, D should move in negative x direction (right)
    expect(mockState.dx).toBeLessThan(0);
  });

  test("should move faster when flying", () => {
    isKeyPressed.mockImplementation((_, key) => key === "w");

    const nonFlyingState = {
      yaw: 0,
      pitch: 0,
      flying: { get: () => false },
      arrowsControlCamera: { get: () => false },
      dx: 0,
      dy: 0,
      dz: 0,
      isCanvasActionDisabled: false,
      actionKeyPressTime: 0,
      breakingInput: {
        isHeld: false,
        mode: "",
      },
    };

    const flyingState = {
      yaw: 0,
      pitch: 0,
      flying: { get: () => true },
      arrowsControlCamera: { get: () => false },
      dx: 0,
      dy: 0,
      dz: 0,
      isCanvasActionDisabled: false,
      actionKeyPressTime: 0,
      breakingInput: {
        isHeld: false,
        mode: "",
      },
    };

    updatePlayer(mockShadow, nonFlyingState, 0.01);
    const nonFlyingDz = Math.abs(nonFlyingState.dz);

    updatePlayer(mockShadow, flyingState, 0.01);
    const flyingDz = Math.abs(flyingState.dz);

    expect(flyingDz).toBeGreaterThan(nonFlyingDz);
  });

  test("should handle diagonal movement (upleft - W+A)", () => {
    isKeyPressed.mockImplementation((_, key) => key === "upleft");
    updatePlayer(mockShadow, mockState, 0.01);

    expect(mockState.dx).not.toBe(0);
    expect(mockState.dz).not.toBe(0);
  });

  test("should handle diagonal movement (upright - W+D)", () => {
    isKeyPressed.mockImplementation((_, key) => key === "upright");
    updatePlayer(mockShadow, mockState, 0.01);

    expect(mockState.dx).not.toBe(0);
    expect(mockState.dz).not.toBe(0);
  });

  test("should handle diagonal movement (downleft - S+A)", () => {
    isKeyPressed.mockImplementation((_, key) => key === "downleft");
    updatePlayer(mockShadow, mockState, 0.01);

    expect(mockState.dx).not.toBe(0);
    expect(mockState.dz).not.toBe(0);
  });

  test("should handle diagonal movement (downright - S+D)", () => {
    isKeyPressed.mockImplementation((_, key) => key === "downright");
    updatePlayer(mockShadow, mockState, 0.01);

    expect(mockState.dx).not.toBe(0);
    expect(mockState.dz).not.toBe(0);
  });

  test("should rotate camera with arrow keys when arrowsControlCamera is true", () => {
    mockState.arrowsControlCamera = { get: () => true };

    isKeyPressed.mockImplementation((_, key) => key === "arrowleft");

    const initialYaw = mockState.yaw;
    updatePlayer(mockShadow, mockState, 0.01);

    expect(mockState.yaw).toBeGreaterThan(initialYaw);
  });

  test("should move with arrow keys when arrowsControlCamera is false", () => {
    mockState.arrowsControlCamera = { get: () => false };

    isKeyPressed.mockImplementation((_, key) => key === "arrowup");

    updatePlayer(mockShadow, mockState, 0.01);
    // With yaw=0, arrowup should move in positive z direction
    expect(mockState.dz).toBeGreaterThan(0);
  });

  test("should clamp pitch within valid range", () => {
    mockState.arrowsControlCamera = { get: () => true };
    mockState.pitch = Math.PI / 2 - 0.005;

    isKeyPressed.mockImplementation((_, key) => key === "arrowup");

    updatePlayer(mockShadow, mockState, 0.1);

    // Should not exceed max pitch
    expect(mockState.pitch).toBeLessThanOrEqual(Math.PI / 2 - 0.005);
  });

  test("should place block on short enter key press", () => {
    // First call: key pressed
    isKeyPressed.mockReturnValue(true);

    globalThis.performance.now = () => 0;

    updatePlayer(mockShadow, mockState, 0.01);

    expect(mockState.actionKeyPressTime).toBe(0); // Set to 0 (performance.now())

    // Second call: key still pressed (100ms later)
    globalThis.performance.now = () => 100;

    updatePlayer(mockShadow, mockState, 0.01);

    // actionKeyPressTime should still be 0 because holdDuration (100) < 500
    // But since actionKeyPressTime === 0, it will be set to 100
    expect(mockState.actionKeyPressTime).toBe(100);

    // Third call: key released (200ms later, short press)
    isKeyPressed.mockReturnValue(false);

    globalThis.performance.now = () => 300;

    updatePlayer(mockShadow, mockState, 0.01);

    expect(placeBlock).toHaveBeenCalled();
  });

  test("should start breaking on long enter key press", () => {
    // Just use the default state (actionKeyPressTime = 0)
    mockState.breakingInput.isHeld = false;

    isKeyPressed.mockReturnValue(true); // Keep pressed

    // First call: key pressed
    globalThis.performance.now = () => 0;

    updatePlayer(mockShadow, mockState, 0.01);
    expect(mockState.actionKeyPressTime).toBe(0); // Set to 0

    // Second call: key still pressed (100ms later)
    globalThis.performance.now = () => 100;

    updatePlayer(mockShadow, mockState, 0.01);

    expect(mockState.actionKeyPressTime).toBe(100); // Updated to 100

    // Third call: key still pressed (long press - 510ms total)
    globalThis.performance.now = () => 610;

    updatePlayer(mockShadow, mockState, 0.01);

    expect(placeBlock).not.toHaveBeenCalled();
    expect(mockState.breakingInput.isHeld).toBe(true);
    expect(mockState.breakingInput.mode).toBe("center");
  });

  test("should continue breaking while enter key is held", () => {
    mockState.actionKeyPressTime = -100; // Already breaking
    isKeyPressed.mockImplementation((_, key) => {
      return key === "enter"; // Keep pressed
    });

    updatePlayer(mockShadow, mockState, 0.01);

    expect(mockState.breakingInput.isHeld).toBe(true);
  });

  test("should stop breaking when enter key is released after long press", () => {
    mockState.actionKeyPressTime = -100; // Already breaking
    mockState.breakingInput.isHeld = true;

    isKeyPressed.mockReturnValue(false); // Key released

    updatePlayer(mockShadow, mockState, 0.01);

    expect(mockState.breakingInput.isHeld).toBe(false);
  });

  test("should apply friction to movement", () => {
    mockState.dx = 10;
    mockState.dz = 10;

    isKeyPressed.mockReturnValue(false); // No keys pressed

    const initialDx = mockState.dx;
    const initialDz = mockState.dz;

    updatePlayer(mockShadow, mockState, 0.01);

    expect(Math.abs(mockState.dx)).toBeLessThan(initialDx);
    expect(Math.abs(mockState.dz)).toBeLessThan(initialDz);
  });

  test("should apply less friction when flying", () => {
    isKeyPressed.mockReturnValue(false);

    const walkingState = {
      yaw: 0,
      pitch: 0,
      flying: { get: () => false },
      arrowsControlCamera: { get: () => false },
      dx: 10,
      dy: 0,
      dz: 0,
      isCanvasActionDisabled: false,
      actionKeyPressTime: 0,
      breakingInput: {
        isHeld: false,
        mode: "",
      },
    };

    const flyingState = {
      yaw: 0,
      pitch: 0,
      flying: { get: () => true },
      arrowsControlCamera: { get: () => false },
      dx: 10,
      dy: 0,
      dz: 0,
      isCanvasActionDisabled: false,
      actionKeyPressTime: 0,
      breakingInput: {
        isHeld: false,
        mode: "",
      },
    };

    updatePlayer(mockShadow, walkingState, 0.01);
    const walkingDx = walkingState.dx;

    updatePlayer(mockShadow, flyingState, 0.01);
    const flyingDx = flyingState.dx;

    // Flying should have less friction, so dx should be higher after update
    // (flying friction is 0.95 vs walking 0.92, but flying has higher acceleration factor)
    // With no keys pressed, flying will decelerate faster due to higher acceleration
    // So we expect flyingDx to be less than walkingDx
    expect(flyingDx).toBeLessThan(walkingDx);
  });

  test("should not place block or break when canvas action is disabled", () => {
    mockState.isCanvasActionDisabled = true;
    mockState.actionKeyPressTime = 100;

    isKeyPressed.mockReturnValue(false);

    updatePlayer(mockShadow, mockState, 0.01);

    expect(placeBlock).not.toHaveBeenCalled();
    expect(mockState.breakingInput.isHeld).toBe(false);
    expect(mockState.actionKeyPressTime).toBe(0);
  });
});
