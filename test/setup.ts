import { vi, beforeEach } from 'vitest';

// Mock Web Crypto API for password hashing
const mockDigest = vi.fn().mockImplementation(async (_algorithm: string, data: ArrayBuffer) => {
  // Create a deterministic hash for testing
  const view = new Uint8Array(data);
  const hashBuffer = new ArrayBuffer(32);
  const hashView = new Uint8Array(hashBuffer);

  // Simple deterministic "hash" for testing - XOR bytes with position
  for (let i = 0; i < 32; i++) {
    hashView[i] = (view[i % view.length] + i) % 256;
  }

  return hashBuffer;
});

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest,
    },
    getRandomValues: vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
  writable: true,
});

// Mock localStorage for auth tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
