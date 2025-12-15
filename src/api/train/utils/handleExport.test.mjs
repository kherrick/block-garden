import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";

import { handleExport } from "./handleExport.mjs";

describe("handleExport", () => {
  let createElementSpy;
  let createObjectURLSpy;
  let revokeObjectURLSpy;
  let mockAnchor;

  beforeEach(() => {
    // Mock the anchor element and its click method
    mockAnchor = {
      href: "",
      download: "",
      click: jest.fn(),
    };

    // Mock document.createElement to return our mock anchor
    createElementSpy = jest
      .spyOn(document, "createElement")
      .mockReturnValue(mockAnchor);

    // JSDOM doesn't implement createObjectURL/revokeObjectURL, so we mock them on window.URL
    window.URL.createObjectURL = jest.fn();
    window.URL.revokeObjectURL = jest.fn();

    // Mock URL methods
    createObjectURLSpy = jest
      .spyOn(window.URL, "createObjectURL")
      .mockReturnValue("blob:http://localhost/mock-url");
    revokeObjectURLSpy = jest.spyOn(window.URL, "revokeObjectURL");

    // Mock Date.now() for predictable filenames
    jest.spyOn(Date, "now").mockReturnValue(1234567890);
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  it("should do nothing if getExportData returns null", () => {
    const getExportData = jest.fn().mockReturnValue(null);

    handleExport({ getExportData });

    expect(getExportData).toHaveBeenCalledTimes(1);
    expect(createElementSpy).not.toHaveBeenCalled();
    expect(createObjectURLSpy).not.toHaveBeenCalled();
  });

  it("should create and click a download link when data is provided", () => {
    const mockData = { foo: "bar" };
    const getExportData = jest.fn().mockReturnValue(mockData);

    handleExport({ getExportData });

    // Verify data retrieval
    expect(getExportData).toHaveBeenCalledTimes(1);

    // Verify Blob creation
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blob = createObjectURLSpy.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");

    // Verify anchor element creation and configuration
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(mockAnchor.href).toBe("blob:http://localhost/mock-url");
    expect(mockAnchor.download).toBe("sprite-garden-qtable-1234567890.json");

    // Verify the download was triggered
    expect(mockAnchor.click).toHaveBeenCalledTimes(1);

    // Verify the object URL was revoked to prevent memory leaks
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(
      "blob:http://localhost/mock-url",
    );
  });
});
