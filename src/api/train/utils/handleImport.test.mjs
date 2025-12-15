import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";

import { handleImport } from "./handleImport.mjs";

describe("handleImport", () => {
  let createElementSpy;
  let mockInput;
  let importAgent;
  let log;

  beforeEach(() => {
    // Mock the input element and its methods
    mockInput = {
      type: "",
      accept: "",
      click: jest.fn(),
      // Capture the event listener to trigger it manually
      addEventListener: jest.fn((event, handler) => {
        if (event === "change") {
          mockInput.changeHandler = handler;
        }
      }),
      changeHandler: null,
    };

    // Mock document.createElement to return our mock input
    createElementSpy = jest
      .spyOn(document, "createElement")
      .mockReturnValue(mockInput);

    // Mock callbacks
    importAgent = jest.fn();
    log = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should create, configure, and click a file input", () => {
    handleImport({ importAgent, log });

    expect(createElementSpy).toHaveBeenCalledWith("input");
    expect(mockInput.type).toBe("file");
    expect(mockInput.accept).toBe(".json");
    expect(mockInput.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    expect(mockInput.click).toHaveBeenCalledTimes(1);
  });

  it("should do nothing if no file is selected", async () => {
    handleImport({ importAgent, log });

    // Simulate the change event with no files
    const mockEvent = { target: { files: [] } };
    await mockInput.changeHandler(mockEvent);

    expect(importAgent).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it("should read the file, parse JSON, and call importAgent on success", async () => {
    const mockData = { q: [], alpha: 0.1 };
    const mockFile = new File([JSON.stringify(mockData)], "q-table.json", {
      type: "application/json",
    });

    // JSDOM's File implementation doesn't have a working .text() method.
    // We need to mock it for the test.
    const mockFileText = jest.fn().mockResolvedValue(JSON.stringify(mockData));
    mockFile.text = mockFileText;

    handleImport({ importAgent, log });

    // Simulate the change event with a valid file
    const mockEvent = { target: { files: [mockFile] } };
    await mockInput.changeHandler(mockEvent);

    expect(importAgent).toHaveBeenCalledTimes(1);
    expect(importAgent).toHaveBeenCalledWith(mockData);
    expect(log).not.toHaveBeenCalled();
  });

  it("should log an error if file reading or JSON parsing fails", async () => {
    const mockFile = new File(["not-json"], "invalid.json", {
      type: "application/json",
    });

    // Mock the .text() method to simulate a file with invalid JSON content.
    const mockFileText = jest.fn().mockResolvedValue("not-json");
    mockFile.text = mockFileText;

    handleImport({ importAgent, log });

    // Simulate the change event with an invalid file
    const mockEvent = { target: { files: [mockFile] } };
    await mockInput.changeHandler(mockEvent);

    expect(importAgent).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("❌ Import failed:"),
      "error",
    );
  });
});
