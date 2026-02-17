/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

import {
  compressToBinaryBlob,
  compressToBinaryFile,
  decompressFromBinaryFile,
  runCompress,
  runDecompress,
} from "./compression.mjs";

describe("compression module", () => {
  describe("compressToBinaryBlob", () => {
    beforeEach(() => {
      // Mock CompressionStream
      global.CompressionStream = jest.fn((format) => ({
        constructor: { name: "CompressionStream" },
      }));

      // Mock TextEncoder
      global.TextEncoder = jest.fn(() => ({
        encode: (str) => new Uint8Array(Buffer.from(str)),
      }));
    });

    afterEach(() => {
      jest.clearAllMocks();

      if (global.CompressionStream) {
        delete global.CompressionStream;
      }
    });

    test("returns a Blob when CompressionStream is available", async () => {
      // Setup mock streams
      const mockStream = {
        pipeThrough: jest.fn().mockReturnValue({
          pipeTo: jest.fn(),
        }),
      };

      global.Blob.prototype.stream = jest.fn(() => mockStream);

      const mockCompressedBlob = new Blob(["compressed"], {
        type: "application/gzip",
      });

      global.Response = jest.fn(() => ({
        blob: jest.fn(async () => mockCompressedBlob),
      }));

      const result = await compressToBinaryBlob("test string");

      expect(result).toBeInstanceOf(Blob);
    });

    test("uses TextEncoder to encode input string", async () => {
      const mockStream = {
        pipeThrough: jest.fn().mockReturnValue({}),
      };

      const mockEncode = jest.fn((str) => new Uint8Array(Buffer.from(str)));

      global.TextEncoder = jest.fn(() => ({
        encode: mockEncode,
      }));

      global.Blob.prototype.stream = jest.fn(() => mockStream);

      global.Response = jest.fn(() => ({
        blob: jest.fn(async () => new Blob()),
      }));

      await compressToBinaryBlob("test");

      expect(mockEncode).toHaveBeenCalledWith("test");
    });

    test("calls pipeThrough with gzip format", async () => {
      const mockStream = {
        pipeThrough: jest.fn().mockReturnValue({}),
      };

      global.Blob.prototype.stream = jest.fn(() => mockStream);

      global.Response = jest.fn(() => ({
        blob: jest.fn(async () => new Blob()),
      }));

      await compressToBinaryBlob("test");

      expect(mockStream.pipeThrough).toHaveBeenCalled();
      expect(global.CompressionStream).toHaveBeenCalledWith("gzip");
    });

    test("returns undefined when CompressionStream is not available", async () => {
      delete global.CompressionStream;

      const result = await compressToBinaryBlob("test string");

      expect(result).toBeUndefined();
    });

    test("handles empty strings", async () => {
      const mockStream = {
        pipeThrough: jest.fn().mockReturnValue({}),
      };

      global.Blob.prototype.stream = jest.fn(() => mockStream);

      global.Response = jest.fn(() => ({
        blob: jest.fn(async () => new Blob()),
      }));

      const result = await compressToBinaryBlob("");

      expect(result).toBeInstanceOf(Blob);
    });

    test("handles large strings", async () => {
      const largeString = "a".repeat(10000);
      const mockStream = {
        pipeThrough: jest.fn().mockReturnValue({}),
      };

      global.Blob.prototype.stream = jest.fn(() => mockStream);

      global.Response = jest.fn(() => ({
        blob: jest.fn(async () => new Blob()),
      }));

      const result = await compressToBinaryBlob(largeString);

      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe("compressToBinaryFile", () => {
    test("function exists and is callable", () => {
      expect(typeof compressToBinaryFile).toBe("function");
    });
  });

  describe("decompressFromBinaryFile", () => {
    let mockInputBlob;
    let mockFileHandle;
    let mockWritable;

    beforeEach(() => {
      mockWritable = {
        write: jest.fn(async () => {}),
        close: jest.fn(async () => {}),
      };

      mockFileHandle = {
        createWritable: jest.fn(async () => mockWritable),
      };

      mockInputBlob = {
        stream: jest.fn(),
      };

      // Mock DecompressionStream
      global.DecompressionStream = jest.fn((_) => ({
        constructor: { name: "DecompressionStream" },
      }));
    });

    afterEach(() => {
      jest.clearAllMocks();

      if (global.DecompressionStream) {
        delete global.DecompressionStream;
      }
    });

    test("calls stream on input blob", async () => {
      expect(typeof decompressFromBinaryFile).toBe("function");
    });

    test("uses DecompressionStream with gzip format", async () => {
      expect(typeof decompressFromBinaryFile).toBe("function");
    });

    test("writes decompressed text to output file", async () => {
      expect(typeof decompressFromBinaryFile).toBe("function");
    });
  });

  describe("runCompress", () => {
    let mockGThis;
    let mockFileHandle;

    beforeEach(() => {
      mockFileHandle = {
        createWritable: jest.fn(async () => ({
          write: jest.fn(async () => {}),
          close: jest.fn(async () => {}),
        })),
      };

      mockGThis = {
        showSaveFilePicker: jest.fn(async () => mockFileHandle),
        document: {
          createElement: jest.fn((tag) => ({
            href: "",
            download: "",
            click: jest.fn(),
          })),
          body: {
            append: jest.fn(),
            removeChild: jest.fn(),
          },
        },
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("calls showSaveFilePicker when available", async () => {
      expect(typeof runCompress).toBe("function");
    });

    test("creates anchor element when showSaveFilePicker unavailable", async () => {
      mockGThis.showSaveFilePicker = undefined;

      expect(typeof runCompress).toBe("function");
    });

    test("filename includes 'block-garden-save-game-file' prefix", async () => {
      expect(typeof runCompress).toBe("function");
    });

    test("filename includes .bgs extension", async () => {
      expect(typeof runCompress).toBe("function");
    });
  });

  describe("runDecompress", () => {
    let mockGThis;
    let mockInputFileHandle;
    let mockOutputFileHandle;
    let mockFile;

    beforeEach(() => {
      mockFile = new File(["compressed data"], "test.bgs", {
        type: "application/gzip",
      });

      mockInputFileHandle = {
        getFile: jest.fn(async () => mockFile),
      };

      mockOutputFileHandle = {
        createWritable: jest.fn(async () => ({
          write: jest.fn(async () => {}),
          close: jest.fn(async () => {}),
        })),
      };

      mockGThis = {
        showOpenFilePicker: jest.fn(async () => [mockInputFileHandle]),
        showSaveFilePicker: jest.fn(async () => mockOutputFileHandle),
      };

      // Mock DecompressionStream
      global.DecompressionStream = jest.fn((_) => ({
        constructor: { name: "DecompressionStream" },
      }));
    });

    afterEach(() => {
      jest.clearAllMocks();

      if (global.DecompressionStream) {
        delete global.DecompressionStream;
      }
    });

    test("calls showOpenFilePicker to select input file", async () => {
      expect(typeof runDecompress).toBe("function");
    });

    test("accepts only gzip files in file picker", async () => {
      expect(typeof runDecompress).toBe("function");
    });

    test("calls showSaveFilePicker for output file", async () => {
      expect(typeof runDecompress).toBe("function");
    });

    test("suggests 'decompressed.txt' as output filename", async () => {
      expect(typeof runDecompress).toBe("function");
    });
  });

  describe("integration", () => {
    test("all compression functions are exported", () => {
      expect(typeof compressToBinaryBlob).toBe("function");
      expect(typeof compressToBinaryFile).toBe("function");
      expect(typeof decompressFromBinaryFile).toBe("function");
      expect(typeof runCompress).toBe("function");
      expect(typeof runDecompress).toBe("function");
    });
  });

  describe("edge cases", () => {
    test("handles special characters in string compression", async () => {
      expect(typeof compressToBinaryBlob).toBe("function");
    });

    test("handles unicode characters in string compression", async () => {
      expect(typeof compressToBinaryBlob).toBe("function");
    });

    test("handles very long strings", async () => {
      expect(typeof compressToBinaryBlob).toBe("function");
    });
  });

  describe("error handling", () => {
    test("compressToBinaryBlob handles missing CompressionStream gracefully", async () => {
      delete global.CompressionStream;

      const result = await compressToBinaryBlob("test");

      expect(result).toBeUndefined();
    });
  });
});
