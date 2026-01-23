/**
 * Firebase Test Helpers
 *
 * Provides utilities for seeding test data directly to Firestore.
 * Uses the same Firebase client SDK as the application.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  connectFirestoreEmulator,
  type Firestore,
  type FieldValue,
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';

// Collection names (matching app constants)
const LEADERBOARD_COLLECTION = 'leaderboard';
const TEAM_LEADERBOARD_COLLECTION = 'teamLeaderboard';
const TEAMS_COLLECTION = 'teams';
const TEAM_MEMBERSHIPS_COLLECTION = 'teamMemberships';

// Emulator configuration
const EMULATOR_HOST = '127.0.0.1';
const AUTH_EMULATOR_PORT = 9099;
const FIRESTORE_EMULATOR_PORT = 8080;
const USE_EMULATOR = process.env.USE_FIREBASE_EMULATOR === 'true';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || '',
};

// Demo configuration for emulator (no real Firebase project needed)
const emulatorConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-test-project.firebaseapp.com',
  projectId: 'demo-test-project',
};

// Singleton instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let emulatorConnected = false;

/**
 * Initialize Firebase app (singleton pattern to avoid multiple initializations)
 */
function getFirebaseApp(): FirebaseApp {
  if (app) return app;

  // Use demo config for emulator, real config otherwise
  const config = USE_EMULATOR ? emulatorConfig : firebaseConfig;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    app = initializeApp(config, 'e2e-test-app');
  }

  return app;
}

/**
 * Get Firebase Auth instance
 */
function getFirebaseAuth(): Auth {
  if (auth) return auth;
  auth = getAuth(getFirebaseApp());
  return auth;
}

/**
 * Get Firestore database instance
 */
function getDb(): Firestore {
  if (db) return db;
  db = getFirestore(getFirebaseApp());

  // Connect to emulators only once
  if (USE_EMULATOR && !emulatorConnected) {
    connectFirestoreEmulator(db, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
    connectAuthEmulator(
      getFirebaseAuth(),
      `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`,
      { disableWarnings: true }
    );
    emulatorConnected = true;
    console.log('[E2E] Connected to Firebase Emulator');
  }

  return db;
}

/**
 * Hash password using SHA-256 (same approach as app)
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate URL-safe slug from team name (same as app)
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Types for seeding functions
export interface LeaderboardScore {
  playerId: string;
  nickname: string;
  score: number;
  level: number;
}

export interface TeamLeaderboardScore {
  teamId: string;
  playerId: string;
  nickname: string;
  score: number;
  level: number;
}

export interface CreateTeamParams {
  name: string;
  creatorId: string;
  creatorNickname: string;
  isPublic: boolean;
  password?: string;
}

export interface CreatedTeam {
  id: string;
  slug: string;
  name: string;
}

/**
 * Seed a score directly to the global leaderboard collection.
 *
 * Document ID: playerId
 * Fields: playerId, nickname, score, level, achievedAt
 *
 * @param params - Leaderboard score parameters
 */
export async function seedLeaderboardScore(
  params: LeaderboardScore
): Promise<void> {
  const { playerId, nickname, score, level } = params;
  const database = getDb();

  const leaderboardRef = doc(database, LEADERBOARD_COLLECTION, playerId);
  await setDoc(leaderboardRef, {
    playerId,
    nickname,
    score,
    level,
    achievedAt: serverTimestamp(),
  });
}

/**
 * Seed a score directly to a team's leaderboard collection.
 *
 * Document ID: ${teamId}_${playerId}
 * Fields: id, teamId, playerId, nickname, score, level, achievedAt
 *
 * @param params - Team leaderboard score parameters
 */
export async function seedTeamLeaderboardScore(
  params: TeamLeaderboardScore
): Promise<void> {
  const { teamId, playerId, nickname, score, level } = params;
  const database = getDb();

  const docId = `${teamId}_${playerId}`;
  const teamLeaderboardRef = doc(database, TEAM_LEADERBOARD_COLLECTION, docId);

  await setDoc(teamLeaderboardRef, {
    id: docId,
    teamId,
    playerId,
    nickname,
    score,
    level,
    achievedAt: serverTimestamp(),
  });
}

/**
 * Create a test team with membership for the creator.
 *
 * Creates:
 * 1. Team document in /teams/{teamId}
 * 2. Creator membership in /teamMemberships/{teamId}_{creatorId}
 *
 * @param params - Team creation parameters
 * @returns Created team info (id, slug, name)
 */
export async function createTestTeam(
  params: CreateTeamParams
): Promise<CreatedTeam> {
  const { name, creatorId, creatorNickname, isPublic, password } = params;
  const database = getDb();

  // Generate slug and team ID
  const slug = slugify(name);
  const slugLower = slug.toLowerCase();
  const teamId = `team_${slugLower}`;

  // Hash password if provided for private teams
  let passwordHash: string | undefined;
  if (!isPublic && password) {
    passwordHash = await hashPassword(password);
  }

  // Create team document
  const teamData: Record<string, string | number | boolean | FieldValue> = {
    id: teamId,
    name: name.trim(),
    slug,
    slugLower,
    creatorId,
    memberCount: 1,
    isPublic,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Only include passwordHash if defined
  if (passwordHash) {
    teamData.passwordHash = passwordHash;
  }

  const teamRef = doc(database, TEAMS_COLLECTION, teamId);
  await setDoc(teamRef, teamData);

  // Create creator's membership document
  const membershipId = `${teamId}_${creatorId}`;
  const membershipData = {
    id: membershipId,
    teamId,
    playerId: creatorId,
    role: 'creator' as const,
    teamName: name.trim(),
    teamSlug: slug,
    playerNickname: creatorNickname,
    joinedAt: serverTimestamp(),
  };

  const membershipRef = doc(database, TEAM_MEMBERSHIPS_COLLECTION, membershipId);
  await setDoc(membershipRef, membershipData);

  return {
    id: teamId,
    slug,
    name: name.trim(),
  };
}

/**
 * Seed multiple leaderboard scores at once.
 * Useful for testing sorting and pagination.
 *
 * @param scores - Array of leaderboard scores
 */
export async function seedMultipleLeaderboardScores(
  scores: LeaderboardScore[]
): Promise<void> {
  for (const score of scores) {
    await seedLeaderboardScore(score);
  }
}

/**
 * Seed multiple team leaderboard scores at once.
 * Useful for testing team leaderboard sorting and pagination.
 *
 * @param scores - Array of team leaderboard scores
 */
export async function seedMultipleTeamLeaderboardScores(
  scores: TeamLeaderboardScore[]
): Promise<void> {
  for (const score of scores) {
    await seedTeamLeaderboardScore(score);
  }
}
