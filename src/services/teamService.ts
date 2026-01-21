// Team Service - Firebase operations for team management
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteField,
  writeBatch,
  query,
  where,
  serverTimestamp,
  Timestamp,
  increment,
  type FieldValue
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Team, TeamMembership, TeamRole } from '../types';

const TEAMS_COLLECTION = 'teams';
const TEAM_MEMBERSHIPS_COLLECTION = 'teamMemberships';
const TEAM_LEADERBOARD_COLLECTION = 'teamLeaderboard';

// Simple hash function using Web Crypto API (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Transform team name to URL-safe slug (name-based, no random suffix)
 * @param name Team name
 * @returns URL-safe slug based on team name
 * @example "Math Wizards" -> "math-wizards"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    // Remove special characters (keep letters, numbers, hyphens)
    .replace(/[^a-z0-9-]/g, '')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Create a new team with unique slug (using transaction for atomicity)
 * @param params Team creation parameters
 * @returns Created team object
 * @throws Error with 'SLUG_TAKEN' message if team name already exists
 */
export async function createTeamWithUniqueSlug(params: {
  name: string;
  creatorId: string;
  creatorNickname: string;
  isPublic: boolean;
  password?: string;
}): Promise<Team> {
  const { name, creatorId, creatorNickname, isPublic, password } = params;

  // Validate inputs
  if (!name || name.trim().length === 0) {
    throw new Error('Team name is required');
  }
  if (name.length < 3 || name.length > 50) {
    throw new Error('Team name must be 3-50 characters');
  }
  if (!isPublic && !password) {
    throw new Error('Password is required for private teams');
  }

  // Generate slug from name
  const slug = slugify(name);
  const slugLower = slug.toLowerCase();

  // Hash password if provided
  let passwordHash: string | undefined;
  if (!isPublic && password) {
    passwordHash = await hashPassword(password);
  }

  // Check if slug already exists (outside transaction to avoid permission issues)
  try {
    const teamsRef = collection(db, TEAMS_COLLECTION);
    const q = query(teamsRef, where('slugLower', '==', slugLower));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error('Team name already taken, please choose a different name');
    }
  } catch (error) {
    // If query fails, continue - let the setDoc handle conflicts
    console.warn('Could not check for existing team:', error);
  }

  try {
    // Generate team ID using slug as base for predictable conflicts
    const teamId = `team_${slugLower}`;

    // Create team document
    const teamData: Omit<Team, 'createdAt' | 'updatedAt'> & {
      createdAt: FieldValue;
      updatedAt: FieldValue;
    } = {
      id: teamId,
      name: name.trim(),
      slug,
      slugLower,
      creatorId,
      memberCount: 1,
      isPublic,
      ...(passwordHash && { passwordHash }), // Only include if defined
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const teamRef = doc(db, TEAMS_COLLECTION, teamId);

    // Check if document already exists
    const existingTeam = await getDoc(teamRef);
    if (existingTeam.exists()) {
      throw new Error('Team name already taken, please choose a different name');
    }

    await setDoc(teamRef, teamData);

    // Create creator's membership
    const membershipId = `${teamId}_${creatorId}`;
    const membershipData: Omit<TeamMembership, 'joinedAt'> & {
      joinedAt: FieldValue;
    } = {
      id: membershipId,
      teamId,
      playerId: creatorId,
      role: 'creator' as TeamRole,
      teamName: name.trim(),
      teamSlug: slug,
      playerNickname: creatorNickname,
      joinedAt: serverTimestamp(),
    };

    const membershipRef = doc(db, TEAM_MEMBERSHIPS_COLLECTION, membershipId);
    await setDoc(membershipRef, membershipData);

    // Return created team with current timestamp
    const now = new Date();
    return {
      ...teamData,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('already taken')) {
      throw error;
    }
    console.error('Create team error:', error);
    throw new Error('Failed to create team. Please try again.');
  }
}

/**
 * Get team by slug (case-insensitive)
 * @param slug Team slug
 * @returns Team object or null if not found
 */
export async function getTeamBySlug(slug: string): Promise<Team | null> {
  try {
    const teamsRef = collection(db, TEAMS_COLLECTION);
    const q = query(teamsRef, where('slugLower', '==', slug.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const teamDoc = querySnapshot.docs[0];
    const data = teamDoc.data();

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      slugLower: data.slugLower,
      creatorId: data.creatorId,
      memberCount: data.memberCount,
      isPublic: data.isPublic,
      passwordHash: data.passwordHash,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
  } catch (error) {
    console.error('Get team by slug error:', error);
    return null;
  }
}

/**
 * Join a team
 * @param params Join team parameters
 * @returns Success status and optional error message
 */
export async function joinTeam(params: {
  teamId: string;
  playerId: string;
  playerNickname: string;
  password?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { teamId, playerId, playerNickname, password } = params;

    // Get team by ID
    const teamRef = doc(db, TEAMS_COLLECTION, teamId);
    const teamDoc = await getDoc(teamRef);

    if (!teamDoc.exists()) {
      return { success: false, error: 'Team not found' };
    }

    const teamData = teamDoc.data();

    // If team is private, verify password
    if (!teamData.isPublic) {
      if (!password) {
        return { success: false, error: 'Password is required for private teams' };
      }

      const passwordHash = await hashPassword(password);
      if (passwordHash !== teamData.passwordHash) {
        return { success: false, error: 'Incorrect password' };
      }
    }

    // Check if already a member
    const membershipId = `${teamId}_${playerId}`;
    const membershipRef = doc(db, TEAM_MEMBERSHIPS_COLLECTION, membershipId);
    const membershipDoc = await getDoc(membershipRef);

    if (membershipDoc.exists()) {
      return { success: false, error: 'You are already a member of this team' };
    }

    // Create membership document
    const membershipData: Omit<TeamMembership, 'joinedAt'> & {
      joinedAt: FieldValue;
    } = {
      id: membershipId,
      teamId,
      playerId,
      role: 'member' as TeamRole,
      teamName: teamData.name,
      teamSlug: teamData.slug,
      playerNickname,
      joinedAt: serverTimestamp(),
    };

    await setDoc(membershipRef, membershipData);

    // Increment team member count
    await updateDoc(teamRef, {
      memberCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Join team error:', error);
    return { success: false, error: 'Failed to join team. Please try again.' };
  }
}

/**
 * Get all teams for a player
 * @param playerId Player ID
 * @returns Array of team memberships ordered by joinedAt desc
 */
export async function getMyTeams(playerId: string): Promise<TeamMembership[]> {
  try {
    const membershipsRef = collection(db, TEAM_MEMBERSHIPS_COLLECTION);
    const q = query(
      membershipsRef,
      where('playerId', '==', playerId)
      // TODO: Add orderBy('joinedAt', 'desc') once composite index is created
      // See firestore.indexes.json for required index definition
    );

    const querySnapshot = await getDocs(q);
    const memberships: TeamMembership[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      memberships.push({
        id: data.id,
        teamId: data.teamId,
        playerId: data.playerId,
        role: data.role as TeamRole,
        teamName: data.teamName,
        teamSlug: data.teamSlug,
        playerNickname: data.playerNickname,
        joinedAt: data.joinedAt instanceof Timestamp ? data.joinedAt.toDate() : new Date(),
      });
    });

    // Client-side sort by joinedAt desc (until Firestore index is created)
    memberships.sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());

    return memberships;
  } catch (error) {
    console.error('Get my teams error:', error);
    return [];
  }
}

/**
 * Member with stats interface
 */
export interface TeamMemberWithStats extends TeamMembership {
  maxScore: number;
  gamesCompleted: number;
  lastActive: Date;
}

/**
 * Get all team members with their engagement stats
 * @param teamId Team ID
 * @returns Array of team members with stats, sorted by maxScore DESC
 */
export async function getTeamMembersWithStats(teamId: string): Promise<TeamMemberWithStats[]> {
  try {
    // Query memberships for this team
    const membershipsRef = collection(db, TEAM_MEMBERSHIPS_COLLECTION);
    const membershipsQuery = query(membershipsRef, where('teamId', '==', teamId));
    const membershipsSnapshot = await getDocs(membershipsQuery);

    // Query leaderboard entries for this team
    const leaderboardRef = collection(db, TEAM_LEADERBOARD_COLLECTION);
    const leaderboardQuery = query(leaderboardRef, where('teamId', '==', teamId));
    const leaderboardSnapshot = await getDocs(leaderboardQuery);

    // Create stats map from leaderboard (playerId -> stats)
    const statsMap = new Map<string, { maxScore: number; achievedAt: Date }>();
    leaderboardSnapshot.forEach((doc) => {
      const data = doc.data();
      statsMap.set(data.playerId, {
        maxScore: data.score || 0,
        achievedAt: data.achievedAt instanceof Timestamp ? data.achievedAt.toDate() : new Date(),
      });
    });

    // Combine membership data with stats
    const membersWithStats: TeamMemberWithStats[] = [];
    membershipsSnapshot.forEach((doc) => {
      const data = doc.data();
      const stats = statsMap.get(data.playerId);

      membersWithStats.push({
        id: data.id,
        teamId: data.teamId,
        playerId: data.playerId,
        role: data.role as TeamRole,
        teamName: data.teamName,
        teamSlug: data.teamSlug,
        playerNickname: data.playerNickname,
        joinedAt: data.joinedAt instanceof Timestamp ? data.joinedAt.toDate() : new Date(),
        maxScore: stats?.maxScore || 0,
        gamesCompleted: stats ? 1 : 0, // Simplified: 1 if has leaderboard entry, 0 if not
        lastActive: stats?.achievedAt || (data.joinedAt instanceof Timestamp ? data.joinedAt.toDate() : new Date()),
      });
    });

    // Sort by maxScore DESC (show top scorers first)
    membersWithStats.sort((a, b) => b.maxScore - a.maxScore);

    return membersWithStats;
  } catch (error) {
    console.error('Get team members with stats error:', error);
    return [];
  }
}

/**
 * Bulk remove team members
 * @param params Removal parameters
 * @returns Success status and optional error message
 */
export async function bulkRemoveMembers(params: {
  teamId: string;
  memberIds: string[]; // Membership IDs (not player IDs)
  requestorId: string; // Player ID of the person making the request
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { teamId, memberIds, requestorId } = params;

    // Validate batch size (Firestore limit is 500, leave buffer)
    if (memberIds.length > 450) {
      return { success: false, error: 'Cannot remove more than 450 members at once' };
    }

    // Verify requestor is creator
    const requestorMembershipId = `${teamId}_${requestorId}`;
    const requestorMembershipRef = doc(db, TEAM_MEMBERSHIPS_COLLECTION, requestorMembershipId);
    const requestorMembershipDoc = await getDoc(requestorMembershipRef);

    if (!requestorMembershipDoc.exists()) {
      return { success: false, error: 'You are not a member of this team' };
    }

    const requestorData = requestorMembershipDoc.data();
    if (requestorData.role !== 'creator') {
      return { success: false, error: 'Only the team creator can remove members' };
    }

    // Prevent creator from removing self
    if (memberIds.includes(requestorMembershipId)) {
      return { success: false, error: 'Cannot remove yourself as creator. Delete the team instead.' };
    }

    // Use batch write for atomic operation
    const batch = writeBatch(db);

    // Delete all membership documents
    memberIds.forEach((membershipId) => {
      const membershipRef = doc(db, TEAM_MEMBERSHIPS_COLLECTION, membershipId);
      batch.delete(membershipRef);
    });

    // Decrement team member count
    const teamRef = doc(db, TEAMS_COLLECTION, teamId);
    batch.update(teamRef, {
      memberCount: increment(-memberIds.length),
      updatedAt: serverTimestamp(),
    });

    // Commit batch
    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Bulk remove members error:', error);
    return { success: false, error: 'Failed to remove members. Please try again.' };
  }
}

/**
 * Update team settings (public/private visibility and password)
 * @param params Update settings parameters
 * @throws Error if requestor is not creator or validation fails
 */
export async function updateTeamSettings(params: {
  teamId: string;
  requestorId: string;
  isPublic: boolean;
  password?: string;
}): Promise<void> {
  const { teamId, requestorId, isPublic, password } = params;

  try {
    // 1. Verify requestor is creator
    const membershipId = `${teamId}_${requestorId}`;
    const membershipRef = doc(db, TEAM_MEMBERSHIPS_COLLECTION, membershipId);
    const membershipDoc = await getDoc(membershipRef);

    if (!membershipDoc.exists()) {
      throw new Error('You are not a member of this team');
    }

    const membershipData = membershipDoc.data();
    if (membershipData.role !== 'creator') {
      throw new Error('Only team creator can update settings');
    }

    // 2. Validate inputs
    if (!isPublic && !password) {
      throw new Error('Password is required for private teams');
    }

    // 3. Hash password if provided
    let passwordHash: string | undefined;
    if (!isPublic && password) {
      passwordHash = await hashPassword(password);
    }

    // 4. Update team document
    const teamRef = doc(db, TEAMS_COLLECTION, teamId);
    const updateData: Record<string, FieldValue | boolean | string> = {
      isPublic,
      updatedAt: serverTimestamp(),
    };

    // Set or remove password hash based on visibility
    if (!isPublic && passwordHash) {
      updateData.passwordHash = passwordHash;
    } else {
      // Remove password hash when switching to public
      updateData.passwordHash = deleteField();
    }

    await updateDoc(teamRef, updateData);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    console.error('Update team settings error:', error);
    throw new Error('Failed to update team settings. Please try again.');
  }
}

/**
 * Delete a team and all associated data (cascade delete)
 * @param teamId Team ID to delete
 * @param requestorId Player ID of the requestor
 * @throws Error if requestor is not creator or deletion fails
 */
export async function deleteTeam(teamId: string, requestorId: string): Promise<void> {
  try {
    // 1. Verify requestor is creator
    const membershipId = `${teamId}_${requestorId}`;
    const membershipRef = doc(db, TEAM_MEMBERSHIPS_COLLECTION, membershipId);
    const membershipDoc = await getDoc(membershipRef);

    if (!membershipDoc.exists()) {
      throw new Error('You are not a member of this team');
    }

    const membershipData = membershipDoc.data();
    if (membershipData.role !== 'creator') {
      throw new Error('Only team creator can delete the team');
    }

    // 2. Query all related documents in parallel
    const membershipsRef = collection(db, TEAM_MEMBERSHIPS_COLLECTION);
    const leaderboardRef = collection(db, TEAM_LEADERBOARD_COLLECTION);

    const [membershipsSnap, leaderboardSnap] = await Promise.all([
      getDocs(query(membershipsRef, where('teamId', '==', teamId))),
      getDocs(query(leaderboardRef, where('teamId', '==', teamId))),
    ]);

    // 3. Calculate total operations and implement chunked batch if needed
    const totalDocs = 1 + membershipsSnap.size + leaderboardSnap.size; // team + memberships + leaderboard

    if (totalDocs > 450) {
      // Chunked batch pattern for large teams
      const chunks: Array<Array<{ ref: any; type: 'delete' | 'update'; data?: any }>> = [];
      let currentChunk: Array<{ ref: any; type: 'delete' | 'update'; data?: any }> = [];

      // Add team deletion
      currentChunk.push({ ref: doc(db, TEAMS_COLLECTION, teamId), type: 'delete' });

      // Add membership deletions
      membershipsSnap.forEach((membershipDoc) => {
        if (currentChunk.length >= 450) {
          chunks.push(currentChunk);
          currentChunk = [];
        }
        currentChunk.push({ ref: membershipDoc.ref, type: 'delete' });
      });

      // Add leaderboard deletions
      leaderboardSnap.forEach((leaderboardDoc) => {
        if (currentChunk.length >= 450) {
          chunks.push(currentChunk);
          currentChunk = [];
        }
        currentChunk.push({ ref: leaderboardDoc.ref, type: 'delete' });
      });

      // Add remaining operations to last chunk
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      // Execute chunks sequentially
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(({ ref, type }) => {
          if (type === 'delete') {
            batch.delete(ref);
          }
        });
        await batch.commit();
      }
    } else {
      // Single batch for smaller teams
      const batch = writeBatch(db);

      // Delete team document
      batch.delete(doc(db, TEAMS_COLLECTION, teamId));

      // Delete all memberships
      membershipsSnap.forEach((membershipDoc) => {
        batch.delete(membershipDoc.ref);
      });

      // Delete all leaderboard entries
      leaderboardSnap.forEach((leaderboardDoc) => {
        batch.delete(leaderboardDoc.ref);
      });

      // Commit batch
      await batch.commit();
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    console.error('Delete team error:', error);
    throw new Error('Failed to delete team. Please try again.');
  }
}

/**
 * Leave a team (remove membership)
 * @param params Leave team parameters
 * @returns Success status and optional error message
 */
export async function leaveTeam(params: {
  teamId: string;
  playerId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { teamId, playerId } = params;

    // 1. Get membership to verify role
    const membershipId = `${teamId}_${playerId}`;
    const membershipRef = doc(db, TEAM_MEMBERSHIPS_COLLECTION, membershipId);
    const membershipDoc = await getDoc(membershipRef);

    if (!membershipDoc.exists()) {
      return { success: false, error: 'You are not a member of this team' };
    }

    const membershipData = membershipDoc.data();

    // 2. Prevent creator from leaving
    if (membershipData.role === 'creator') {
      return { success: false, error: 'Team creator cannot leave team. Delete team instead.' };
    }

    // 3. Batch delete membership and update count
    const batch = writeBatch(db);

    // Delete membership document
    batch.delete(membershipRef);

    // Decrement team member count
    const teamRef = doc(db, TEAMS_COLLECTION, teamId);
    batch.update(teamRef, {
      memberCount: increment(-1),
      updatedAt: serverTimestamp(),
    });

    // Commit batch
    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Leave team error:', error);
    return { success: false, error: 'Failed to leave team. Please try again.' };
  }
}
