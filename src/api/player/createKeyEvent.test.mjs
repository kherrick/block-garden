/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { createKeyEvent } from "./createKeyEvent.mjs";
import { codeMap, keyMap } from "../misc/keys.mjs";

describe("createKeyEvent", () => {
  it("should create a KeyboardEvent with the specified type", () => {
    const event = createKeyEvent("keydown", 65);
    expect(event).toBeInstanceOf(KeyboardEvent);
    expect(event.type).toBe("keydown");
  });

  it("should assign the correct keyCode and which properties", () => {
    const keyCode = 65; // 'A'
    const event = createKeyEvent("keydown", keyCode);
    expect(event.keyCode).toBe(keyCode);
    expect(event.which).toBe(keyCode);
  });

  it("should use the provided keyMap to set the key property", () => {
    const event = createKeyEvent("keydown", 65);
    expect(event.key).toBe(keyMap[65]);
  });

  it("should use the provided codeMap to set the code property", () => {
    const event = createKeyEvent("keydown", 65);
    expect(event.code).toBe(codeMap[65]);
  });

  it("should handle unknown keyCodes gracefully", () => {
    const unknownKeyCode = 999;
    const event = createKeyEvent("keydown", unknownKeyCode);
    expect(event.key).toBe("");
    expect(event.code).toBe("");
  });

  it("should create a bubbling event", () => {
    const event = createKeyEvent("keydown", 65);
    expect(event.bubbles).toBe(true);
  });

  it("should create a cancelable event", () => {
    const event = createKeyEvent("keydown", 65);
    expect(event.cancelable).toBe(true);
  });

  it("should create a composed event", () => {
    const event = createKeyEvent("keydown", 65);
    expect(event.composed).toBe(true);
  });

  it("should work with different event types", () => {
    const event = createKeyEvent("keyup", 32);
    expect(event.type).toBe("keyup");
    expect(event.keyCode).toBe(32);
  });
});
