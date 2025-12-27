/**
 * @jest-environment jsdom
 */
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  base64toBlob,
} from "./conversion.mjs";

describe("conversion module", () => {
  describe("arrayBufferToBase64", () => {
    let mockGThis;

    beforeEach(() => {
      mockGThis = globalThis;
    });

    test("encodes simple ArrayBuffer to base64", () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const buffer = data.buffer;

      const result = arrayBufferToBase64(mockGThis, buffer);

      expect(typeof result).toBe("string");
      expect(result).toBe("SGVsbG8=");
    });

    test("encodes empty ArrayBuffer to empty base64", () => {
      const buffer = new ArrayBuffer(0);

      const result = arrayBufferToBase64(mockGThis, buffer);

      expect(result).toBe("");
    });

    test("encodes single byte", () => {
      const data = new Uint8Array([65]); // "A"
      const buffer = data.buffer;

      const result = arrayBufferToBase64(mockGThis, buffer);

      expect(result).toBe("QQ==");
    });

    test("encodes multiple bytes with various values", () => {
      const data = new Uint8Array([0, 1, 255, 128, 64]);
      const buffer = data.buffer;

      const result = arrayBufferToBase64(mockGThis, buffer);

      expect(typeof result).toBe("string");
      expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });

    test("produces same result for same input", () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const buffer = data.buffer;

      const result1 = arrayBufferToBase64(mockGThis, buffer);
      const result2 = arrayBufferToBase64(mockGThis, buffer);

      expect(result1).toBe(result2);
    });

    test("handles large ArrayBuffer", () => {
      const largeData = new Uint8Array(10000);

      for (let i = 0; i < 10000; i++) {
        largeData[i] = i % 256;
      }

      const buffer = largeData.buffer;
      const result = arrayBufferToBase64(mockGThis, buffer);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("preserves all byte values correctly", () => {
      const data = new Uint8Array(256);

      for (let i = 0; i < 256; i++) {
        data[i] = i;
      }

      const buffer = data.buffer;
      const result = arrayBufferToBase64(mockGThis, buffer);

      const decoded = mockGThis.atob(result);

      expect(decoded.length).toBe(256);

      for (let i = 0; i < 256; i++) {
        expect(decoded.charCodeAt(i)).toBe(i);
      }
    });
  });

  describe("base64ToArrayBuffer", () => {
    let mockGThis;

    beforeEach(() => {
      mockGThis = globalThis;
    });

    test("decodes base64 string to ArrayBuffer", () => {
      const base64 = "SGVsbG8="; // "Hello"
      const result = base64ToArrayBuffer(mockGThis, base64);

      expect(result).toBeInstanceOf(ArrayBuffer);

      const bytes = new Uint8Array(result);

      expect(bytes).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    });

    test("decodes empty base64 string", () => {
      const result = base64ToArrayBuffer(mockGThis, "");

      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBe(0);
    });

    test("decodes single character base64", () => {
      const base64 = "QQ=="; // "A"
      const result = base64ToArrayBuffer(mockGThis, base64);

      expect(result).toBeInstanceOf(ArrayBuffer);

      const bytes = new Uint8Array(result);

      expect(bytes).toEqual(new Uint8Array([65]));
    });

    test("returns ArrayBuffer with correct byteLength", () => {
      const base64 = "AQIDBA=="; // [1, 2, 3, 4]
      const result = base64ToArrayBuffer(mockGThis, base64);

      expect(result.byteLength).toBe(4);
    });

    test("produces same result for same input", () => {
      const base64 = "SGVsbG8gV29ybGQ="; // "Hello World"

      const result1 = base64ToArrayBuffer(mockGThis, base64);
      const result2 = base64ToArrayBuffer(mockGThis, base64);

      const bytes1 = new Uint8Array(result1);
      const bytes2 = new Uint8Array(result2);

      expect(bytes1).toEqual(bytes2);
    });

    test("handles large base64 strings", () => {
      const largeData = new Uint8Array(1000);

      for (let i = 0; i < 1000; i++) {
        largeData[i] = i % 256;
      }

      const base64 = mockGThis.btoa(String.fromCharCode(...largeData));
      const result = base64ToArrayBuffer(mockGThis, base64);

      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBe(1000);
    });

    test("preserves all byte values correctly", () => {
      const originalData = new Uint8Array(256);

      for (let i = 0; i < 256; i++) {
        originalData[i] = i;
      }

      const base64 = mockGThis.btoa(String.fromCharCode(...originalData));
      const result = base64ToArrayBuffer(mockGThis, base64);
      const resultBytes = new Uint8Array(result);

      expect(resultBytes).toEqual(originalData);
    });
  });

  describe("base64toBlob", () => {
    let mockGThis;

    beforeEach(() => {
      mockGThis = globalThis;
    });

    test("converts base64 to Blob", () => {
      const base64 = "SGVsbG8="; // "Hello"
      const mimeType = "text/plain";
      const result = base64toBlob(mockGThis, base64, mimeType);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe(mimeType);
    });

    test("creates Blob with correct MIME type", () => {
      const base64 = mockGThis.btoa("test");
      const mimeType = "application/json";
      const result = base64toBlob(mockGThis, base64, mimeType);

      expect(result.type).toBe(mimeType);
    });

    test("creates Blob with correct size", () => {
      const originalData = new Uint8Array([1, 2, 3, 4, 5]);
      const base64 = mockGThis.btoa(String.fromCharCode(...originalData));
      const result = base64toBlob(
        mockGThis,
        base64,
        "application/octet-stream",
      );

      expect(result.size).toBe(originalData.length);
    });

    test("Blob is instance of Blob class", () => {
      const originalStr = "Hello World";
      const base64 = mockGThis.btoa(originalStr);
      const result = base64toBlob(mockGThis, base64, "text/plain");

      expect(result).toBeInstanceOf(Blob);
    });

    test("creates empty Blob from empty base64", () => {
      const result = base64toBlob(mockGThis, "", "text/plain");

      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBe(0);
    });

    test("handles different MIME types", () => {
      const base64 = mockGThis.btoa("test");
      const mimeTypes = [
        "text/plain",
        "application/json",
        "application/octet-stream",
        "image/png",
      ];

      mimeTypes.forEach((mimeType) => {
        const result = base64toBlob(mockGThis, base64, mimeType);

        expect(result.type).toBe(mimeType);
      });
    });

    test("Blob size reflects data length", () => {
      const originalData = new Uint8Array([10, 20, 30, 40]);
      const base64 = mockGThis.btoa(String.fromCharCode(...originalData));
      const result = base64toBlob(
        mockGThis,
        base64,
        "application/octet-stream",
      );

      expect(result.size).toBe(originalData.length);
    });

    test("large binary data Blob size", () => {
      const largeData = new Uint8Array(5000);

      for (let i = 0; i < 5000; i++) {
        largeData[i] = i % 256;
      }

      const base64 = mockGThis.btoa(String.fromCharCode(...largeData));

      const result = base64toBlob(
        mockGThis,
        base64,
        "application/octet-stream",
      );

      expect(result.size).toBe(5000);
    });
  });

  describe("round-trip conversions", () => {
    let mockGThis;

    beforeEach(() => {
      mockGThis = globalThis;
    });

    test("ArrayBuffer -> Base64 -> ArrayBuffer round trip", () => {
      const originalData = new Uint8Array([1, 2, 3, 4, 5]);
      const originalBuffer = originalData.buffer;
      const base64 = arrayBufferToBase64(mockGThis, originalBuffer);
      const resultBuffer = base64ToArrayBuffer(mockGThis, base64);
      const resultData = new Uint8Array(resultBuffer);

      expect(resultData).toEqual(originalData);
    });

    test("Blob creation preserves data size", () => {
      const originalData = new Uint8Array([10, 20, 30, 40, 50]);
      const originalBuffer = originalData.buffer;
      const base64 = arrayBufferToBase64(mockGThis, originalBuffer);
      const blob = base64toBlob(mockGThis, base64, "application/octet-stream");

      expect(blob.size).toBe(originalData.length);
    });

    test("binary data with all byte values round trip", () => {
      const originalData = new Uint8Array(256);

      for (let i = 0; i < 256; i++) {
        originalData[i] = i;
      }

      const originalBuffer = originalData.buffer;
      const base64 = arrayBufferToBase64(mockGThis, originalBuffer);
      const resultBuffer = base64ToArrayBuffer(mockGThis, base64);
      const resultData = new Uint8Array(resultBuffer);

      expect(resultData).toEqual(originalData);
    });
  });

  describe("edge cases", () => {
    let mockGThis;

    beforeEach(() => {
      mockGThis = globalThis;
    });

    test("handles base64 with padding", () => {
      const base64 = "SGVsbG8=";
      const result = base64ToArrayBuffer(mockGThis, base64);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    test("handles base64 without padding", () => {
      const originalData = new Uint8Array([1, 2]);
      const base64 = mockGThis.btoa(String.fromCharCode(...originalData));
      const result = base64ToArrayBuffer(mockGThis, base64);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    test("null MIME type for Blob", () => {
      const base64 = mockGThis.btoa("test");
      const result = base64toBlob(mockGThis, base64, "");

      expect(result.type).toBe("");
    });
  });

  describe("integration", () => {
    let mockGThis;

    beforeEach(() => {
      mockGThis = globalThis;
    });

    test("all conversion functions are exported", () => {
      expect(typeof arrayBufferToBase64).toBe("function");
      expect(typeof base64ToArrayBuffer).toBe("function");
      expect(typeof base64toBlob).toBe("function");
    });

    test("functions produce valid base64", () => {
      const data = new Uint8Array([65, 66, 67]);
      const buffer = data.buffer;
      const result = arrayBufferToBase64(mockGThis, buffer);

      expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });

    test("functions handle different data types", () => {
      const testCases = [
        new Uint8Array([]),
        new Uint8Array([0]),
        new Uint8Array([255]),
        new Uint8Array([1, 2, 3, 4, 5]),
      ];

      testCases.forEach((data) => {
        const buffer = data.buffer;
        const base64 = arrayBufferToBase64(mockGThis, buffer);
        const result = base64ToArrayBuffer(mockGThis, base64);
        const resultData = new Uint8Array(result);

        expect(resultData).toEqual(data);
      });
    });
  });
});
