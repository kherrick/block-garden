/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// Mock dependencies
jest.unstable_mockModule("./loadSave.mjs", () => ({
  loadSaveState: jest.fn(() => Promise.resolve(true)),
}));

jest.unstable_mockModule("./shareTarget.mjs", () => ({
  retrieveSharedSave: jest.fn(),
  deleteSharedSave: jest.fn(),
}));

const { loadSharedSaveIfPending } = await import("./loadSharedSave.mjs");
const { loadSaveState } = await import("./loadSave.mjs");
const { retrieveSharedSave, deleteSharedSave } =
  await import("./shareTarget.mjs");

// Suppress console.info and console.error
const originalInfo = console.info;
const originalError = console.error;

beforeAll(() => {
  console.info = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.info = originalInfo;
  console.error = originalError;
});

describe("loadSharedSaveIfPending", () => {
  let mockGlobal;
  let mockShadow;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGlobal = {};
    mockShadow = {};
  });

  test("should return false when no shared save found", async () => {
    retrieveSharedSave.mockResolvedValue(null);

    const result = await loadSharedSaveIfPending(mockGlobal, mockShadow);

    expect(result).toBe(false);
    expect(retrieveSharedSave).toHaveBeenCalled();
    expect(loadSaveState).not.toHaveBeenCalled();
    expect(deleteSharedSave).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      "[SharedSave] No pending shared save found",
    );
  });

  test("should return false when shared save has no data", async () => {
    retrieveSharedSave.mockResolvedValue({});

    const result = await loadSharedSaveIfPending(mockGlobal, mockShadow);

    expect(result).toBe(false);
    expect(console.info).toHaveBeenCalledWith(
      "[SharedSave] No pending shared save found",
    );
  });

  test("should load shared save when found", async () => {
    const mockSaveState = { world: { 0: { 0: { 10: 1 } } } };
    retrieveSharedSave.mockResolvedValue({ data: mockSaveState });

    loadSaveState.mockResolvedValue(true);

    const result = await loadSharedSaveIfPending(mockGlobal, mockShadow);

    expect(result).toBe(true);
    expect(loadSaveState).toHaveBeenCalledWith(
      mockGlobal,
      mockShadow,
      mockSaveState,
    );

    expect(deleteSharedSave).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      "[SharedSave] Found pending shared save, loading into game state",
    );

    expect(console.info).toHaveBeenCalledWith(
      "[SharedSave] Successfully loaded shared save",
    );
  });

  test("should return false and log error when loadSaveState fails", async () => {
    const mockSaveState = { world: { 0: { 0: { 10: 1 } } } };
    retrieveSharedSave.mockResolvedValue({ data: mockSaveState });

    loadSaveState.mockRejectedValue(new Error("Load error"));

    const result = await loadSharedSaveIfPending(mockGlobal, mockShadow);

    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      "[SharedSave] Error loading shared save:",
      expect.any(Error),
    );
  });

  test("should return false when retrieveSharedSave throws error", async () => {
    retrieveSharedSave.mockRejectedValue(new Error("Retrieve error"));

    const result = await loadSharedSaveIfPending(mockGlobal, mockShadow);

    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      "[SharedSave] Error loading shared save:",
      expect.any(Error),
    );
  });

  test("should return false when deleteSharedSave throws error", async () => {
    const mockSaveState = { world: { 0: { 0: { 10: 1 } } } };
    retrieveSharedSave.mockResolvedValue({ data: mockSaveState });

    loadSaveState.mockResolvedValue(true);
    deleteSharedSave.mockRejectedValue(new Error("Delete error"));

    const result = await loadSharedSaveIfPending(mockGlobal, mockShadow);

    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      "[SharedSave] Error loading shared save:",
      expect.any(Error),
    );
  });
});
