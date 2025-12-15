import { ACTIONS } from "../../misc/actions.mjs";
import { getValidActions } from "./getValidActions.mjs";

describe("getValidActions", () => {
  const baseState = {
    canJump: false,
    onGround: false,
    hasSeeds: false,
    farmableBelow: false,
    alreadyPlanted: false,
    seedSelected: false,
    selectedSeedCount: 0,
  };

  const alwaysPresentActions = [
    ACTIONS.LEFT,
    ACTIONS.RIGHT,
    ACTIONS.TOGGLE_SPEED,
    ACTIONS.NOOP,
  ];

  it("should only return always-present actions for base state", () => {
    const validActions = getValidActions(baseState);
    expect(validActions).toEqual(expect.arrayContaining(alwaysPresentActions));
    expect(validActions.length).toBe(alwaysPresentActions.length);
  });

  // UP action tests
  it("should include UP action when state.canJump and state.onGround are true", () => {
    const state = {
      ...baseState,
      canJump: true,
      onGround: true,
    };
    const validActions = getValidActions(state);
    expect(validActions).toContain(ACTIONS.UP);
  });

  it("should NOT include UP action when state.canJump is false", () => {
    const state = {
      ...baseState,
      onGround: true,
    };
    const validActions = getValidActions(state);
    expect(validActions).not.toContain(ACTIONS.UP);
  });

  it("should NOT include UP action when state.onGround is false", () => {
    const state = {
      ...baseState,
      canJump: true,
    };
    const validActions = getValidActions(state);
    expect(validActions).not.toContain(ACTIONS.UP);
  });

  // PLANT action tests
  it("should include PLANT action when conditions are met", () => {
    const state = {
      ...baseState,
      hasSeeds: true,
      farmableBelow: true,
      alreadyPlanted: false,
    };
    const validActions = getValidActions(state);
    expect(validActions).toContain(ACTIONS.PLANT);
  });

  it("should NOT include PLANT action when hasSeeds is false", () => {
    const state = {
      ...baseState,
      farmableBelow: true,
      alreadyPlanted: false,
    };
    const validActions = getValidActions(state);
    expect(validActions).not.toContain(ACTIONS.PLANT);
  });

  it("should NOT include PLANT action when farmableBelow is false", () => {
    const state = {
      ...baseState,
      hasSeeds: true,
      alreadyPlanted: false,
    };
    const validActions = getValidActions(state);
    expect(validActions).not.toContain(ACTIONS.PLANT);
  });

  it("should NOT include PLANT action when alreadyPlanted is true", () => {
    const state = {
      ...baseState,
      hasSeeds: true,
      farmableBelow: true,
      alreadyPlanted: true,
    };
    const validActions = getValidActions(state);
    expect(validActions).not.toContain(ACTIONS.PLANT);
  });

  // SELECT_SEED action tests
  it("should include SELECT_SEED when hasSeeds is true and no seed is selected", () => {
    const state = {
      ...baseState,
      hasSeeds: true,
      seedSelected: false,
    };
    const validActions = getValidActions(state);
    expect(validActions).toContain(ACTIONS.SELECT_SEED);
  });

  it("should include SELECT_SEED when hasSeeds is true and selected seed count is 0", () => {
    const state = {
      ...baseState,
      hasSeeds: true,
      seedSelected: true,
      selectedSeedCount: 0,
    };
    const validActions = getValidActions(state);
    expect(validActions).toContain(ACTIONS.SELECT_SEED);
  });

  it("should NOT include SELECT_SEED when hasSeeds is false", () => {
    const state = {
      ...baseState,
      hasSeeds: false,
    };
    const validActions = getValidActions(state);
    expect(validActions).not.toContain(ACTIONS.SELECT_SEED);
  });

  it("should NOT include SELECT_SEED when a seed is selected and its count is > 0", () => {
    const state = {
      ...baseState,
      hasSeeds: true,
      seedSelected: true,
      selectedSeedCount: 1,
    };
    const validActions = getValidActions(state);
    expect(validActions).not.toContain(ACTIONS.SELECT_SEED);
  });
});
