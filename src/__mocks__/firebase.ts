import { vi } from 'vitest';

// Mock Firestore types
interface MockDocSnapshot {
  id: string;
  exists: () => boolean;
  data: () => Record<string, unknown> | undefined;
  ref: { id: string };
}

interface MockQuerySnapshot {
  empty: boolean;
  docs: MockDocSnapshot[];
  forEach: (callback: (doc: MockDocSnapshot) => void) => void;
  size: number;
}

// Create configurable mock state
let mockDocData: Record<string, Record<string, unknown>> = {};
let mockQueryResults: Record<string, unknown[]> = {};

// Reset function for tests
export function resetMocks() {
  mockDocData = {};
  mockQueryResults = {};
}

// Set mock document data
export function setMockDoc(path: string, data: Record<string, unknown> | null) {
  if (data === null) {
    delete mockDocData[path];
  } else {
    mockDocData[path] = data;
  }
}

// Set mock query results
export function setMockQueryResults(queryKey: string, results: Record<string, unknown>[]) {
  mockQueryResults[queryKey] = results;
}

// Mock Firestore db
export const db = {};

// Mock collection reference
export const collection = vi.fn((_db: unknown, collectionPath: string) => ({
  path: collectionPath,
}));

// Mock document reference
export const doc = vi.fn((_dbOrRef: unknown, ...pathSegments: string[]) => {
  const path = pathSegments.join('/');
  return {
    id: pathSegments[pathSegments.length - 1] || 'mock-id',
    path,
  };
});

// Mock query
export const query = vi.fn((collectionRef: unknown, ...constraints: unknown[]) => ({
  _collectionRef: collectionRef,
  _constraints: constraints,
}));

// Mock where constraint
export const where = vi.fn((field: string, op: string, value: unknown) => ({
  field,
  op,
  value,
}));

// Mock getDocs - returns query results
export const getDocs = vi.fn(async (queryRef: { _constraints?: { field: string; value: unknown }[] }) => {
  // Find matching mock data based on query constraints
  let results: Record<string, unknown>[] = [];

  if (queryRef._constraints && queryRef._constraints.length > 0) {
    const constraint = queryRef._constraints[0];
    const queryKey = `${constraint.field}:${constraint.value}`;
    results = (mockQueryResults[queryKey] || []) as Record<string, unknown>[];
  }

  const docs: MockDocSnapshot[] = results.map((data, index) => ({
    id: (data as Record<string, unknown>).id as string || `doc-${index}`,
    exists: () => true,
    data: () => data,
    ref: { id: (data as Record<string, unknown>).id as string || `doc-${index}` },
  }));

  const snapshot: MockQuerySnapshot = {
    empty: docs.length === 0,
    docs,
    forEach: (callback) => docs.forEach(callback),
    size: docs.length,
  };

  return snapshot;
});

// Mock getDoc - returns single document
export const getDoc = vi.fn(async (docRef: { path: string; id: string }) => {
  const data = mockDocData[docRef.path] || mockDocData[docRef.id];

  return {
    exists: () => !!data,
    data: () => data,
    id: docRef.id,
    ref: docRef,
  };
});

// Mock setDoc
export const setDoc = vi.fn(async (docRef: { path: string }, data: Record<string, unknown>) => {
  mockDocData[docRef.path] = data;
  return Promise.resolve();
});

// Mock updateDoc
export const updateDoc = vi.fn(async (docRef: { path: string }, data: Record<string, unknown>) => {
  if (mockDocData[docRef.path]) {
    mockDocData[docRef.path] = { ...mockDocData[docRef.path], ...data };
  }
  return Promise.resolve();
});

// Mock deleteDoc
export const deleteDoc = vi.fn(async (docRef: { path: string }) => {
  delete mockDocData[docRef.path];
  return Promise.resolve();
});

// Mock writeBatch
export const writeBatch = vi.fn(() => {
  const operations: Array<{ type: string; ref: unknown; data?: unknown }> = [];

  return {
    delete: vi.fn((ref: unknown) => {
      operations.push({ type: 'delete', ref });
    }),
    set: vi.fn((ref: unknown, data: unknown) => {
      operations.push({ type: 'set', ref, data });
    }),
    update: vi.fn((ref: unknown, data: unknown) => {
      operations.push({ type: 'update', ref, data });
    }),
    commit: vi.fn(async () => {
      // Apply operations
      return Promise.resolve();
    }),
  };
});

// Mock Timestamp
export const Timestamp = {
  now: () => ({ toDate: () => new Date() }),
  fromDate: (date: Date) => ({ toDate: () => date }),
};

// Mock serverTimestamp
export const serverTimestamp = vi.fn(() => ({
  _isServerTimestamp: true,
  toDate: () => new Date(),
}));

// Mock increment
export const increment = vi.fn((n: number) => ({
  _isIncrement: true,
  _incrementValue: n,
}));

// Mock deleteField
export const deleteField = vi.fn(() => ({
  _isDeleteField: true,
}));
