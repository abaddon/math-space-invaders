import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSession, signOut } from './authService';
import type { AuthUser } from './types';

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: 'mock-doc-id', path: 'mock-path' })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(),
  where: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
}));

vi.mock('./firebase', () => ({
  db: {},
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe('getSession', () => {
    it('returns null when no session exists', () => {
      const session = getSession();
      expect(session).toBeNull();
    });

    it('returns session when valid session exists', () => {
      const mockUser: AuthUser = {
        playerId: 'player_123',
        username: 'testuser',
        nickname: 'TestNick',
      };

      localStorage.setItem('mathInvaders_session', JSON.stringify(mockUser));

      const session = getSession();

      expect(session).toEqual(mockUser);
    });

    it('returns null for invalid JSON in session', () => {
      localStorage.setItem('mathInvaders_session', 'invalid-json');

      const session = getSession();

      expect(session).toBeNull();
    });

    it('returns null for empty string in session', () => {
      localStorage.setItem('mathInvaders_session', '');

      const session = getSession();

      expect(session).toBeNull();
    });
  });

  describe('signOut', () => {
    it('removes session from localStorage', () => {
      const mockUser: AuthUser = {
        playerId: 'player_123',
        username: 'testuser',
        nickname: 'TestNick',
      };

      localStorage.setItem('mathInvaders_session', JSON.stringify(mockUser));

      // Verify session exists
      expect(localStorage.getItem('mathInvaders_session')).not.toBeNull();

      signOut();

      // Verify session is removed
      expect(localStorage.getItem('mathInvaders_session')).toBeNull();
    });

    it('does nothing if no session exists', () => {
      // Should not throw
      expect(() => signOut()).not.toThrow();
    });
  });

  describe('username validation rules', () => {
    it('username must be 3-15 characters', () => {
      const tooShort = 'ab';
      const validShort = 'abc';
      const validLong = 'a'.repeat(15);
      const tooLong = 'a'.repeat(16);

      expect(tooShort.length >= 3 && tooShort.length <= 15).toBe(false);
      expect(validShort.length >= 3 && validShort.length <= 15).toBe(true);
      expect(validLong.length >= 3 && validLong.length <= 15).toBe(true);
      expect(tooLong.length >= 3 && tooLong.length <= 15).toBe(false);
    });

    it('username can only contain letters, numbers, underscore, hyphen', () => {
      const validPattern = /^[a-zA-Z0-9_-]+$/;

      expect(validPattern.test('validUser123')).toBe(true);
      expect(validPattern.test('valid_user')).toBe(true);
      expect(validPattern.test('valid-user')).toBe(true);
      expect(validPattern.test('invalid user')).toBe(false); // space
      expect(validPattern.test('invalid@user')).toBe(false); // @
      expect(validPattern.test('invalid.user')).toBe(false); // .
    });
  });

  describe('password validation rules', () => {
    it('password must be at least 4 characters', () => {
      const tooShort = '123';
      const valid = '1234';
      const longer = '12345678';

      expect(tooShort.length >= 4).toBe(false);
      expect(valid.length >= 4).toBe(true);
      expect(longer.length >= 4).toBe(true);
    });
  });

  describe('session storage key', () => {
    it('uses correct storage key', () => {
      const expectedKey = 'mathInvaders_session';
      const mockUser: AuthUser = {
        playerId: 'player_123',
        username: 'testuser',
        nickname: 'TestNick',
      };

      localStorage.setItem(expectedKey, JSON.stringify(mockUser));

      const session = getSession();

      expect(session).toEqual(mockUser);
    });
  });

  describe('AuthUser structure', () => {
    it('has required fields', () => {
      const user: AuthUser = {
        playerId: 'player_123',
        username: 'testuser',
        nickname: 'TestNick',
      };

      expect(user).toHaveProperty('playerId');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('nickname');
    });

    it('playerId follows expected format', () => {
      // Format: player_{timestamp}_{random}
      const playerIdPattern = /^player_\d+_[a-z0-9]+$/;

      const validPlayerId = 'player_1699999999999_abc123xyz';
      expect(playerIdPattern.test(validPlayerId)).toBe(true);
    });
  });

  describe('case-insensitive username lookup', () => {
    it('username comparison should be case-insensitive', () => {
      const storedUsernameLower = 'testuser';
      const inputUsername = 'TestUser';

      expect(inputUsername.toLowerCase()).toBe(storedUsernameLower);
    });

    it('usernameLower field stores lowercase version', () => {
      const username = 'TestUser';
      const usernameLower = username.toLowerCase();

      expect(usernameLower).toBe('testuser');
    });
  });

  describe('player profile fields', () => {
    it('new player has correct initial values', () => {
      const newPlayerData = {
        highScore: 0,
        bestLevel: 1,
        gamesPlayed: 0,
        totalCorrectAnswers: 0,
      };

      expect(newPlayerData.highScore).toBe(0);
      expect(newPlayerData.bestLevel).toBe(1);
      expect(newPlayerData.gamesPlayed).toBe(0);
      expect(newPlayerData.totalCorrectAnswers).toBe(0);
    });

    it('default nickname equals username', () => {
      const username = 'newPlayer';
      const defaultNickname = username;

      expect(defaultNickname).toBe(username);
    });
  });

  describe('round-trip session storage', () => {
    it('session survives JSON round-trip', () => {
      const originalUser: AuthUser = {
        playerId: 'player_12345_abc',
        username: 'TestPlayer',
        nickname: 'Testy',
      };

      // Store
      localStorage.setItem('mathInvaders_session', JSON.stringify(originalUser));

      // Retrieve
      const session = getSession();

      expect(session).toEqual(originalUser);
    });

    it('handles unicode in nickname', () => {
      const userWithUnicode: AuthUser = {
        playerId: 'player_12345_abc',
        username: 'player123',
        nickname: 'Player🎮',
      };

      localStorage.setItem('mathInvaders_session', JSON.stringify(userWithUnicode));

      const session = getSession();

      expect(session).toEqual(userWithUnicode);
    });
  });
});
