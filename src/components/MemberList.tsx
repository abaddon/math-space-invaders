import { useEffect, useState, useCallback } from 'react';
import { getTeamMembersWithStats, bulkRemoveMembers, type TeamMemberWithStats } from '../services/teamService';
import './MemberList.css';

interface MemberListProps {
  teamId: string;
  authPlayerId: string;
  onClose: () => void;
  onMembersChanged: () => void;
}

export function MemberList({ teamId, authPlayerId, onClose, onMembersChanged }: MemberListProps) {
  const [members, setMembers] = useState<TeamMemberWithStats[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState('');

  // Find creator's membership to exclude from selection
  const creatorMembership = members.find(m => m.role === 'creator');
  const creatorMembershipId = creatorMembership?.id;

  // Load members function
  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getTeamMembersWithStats(teamId);
      setMembers(data);
    } catch (err) {
      setError('Failed to load team members');
      console.error('Load members error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  // Load members on mount and when teamId changes
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const toggleSelection = (membershipId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(membershipId)) {
      newSelected.delete(membershipId);
    } else {
      newSelected.add(membershipId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === selectableMembers.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all (excluding creator)
      const allSelectableIds = selectableMembers.map(m => m.id);
      setSelectedIds(new Set(allSelectableIds));
    }
  };

  const handleRemove = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Remove ${selectedIds.size} member${selectedIds.size > 1 ? 's' : ''}?`
    );

    if (!confirmed) return;

    setIsRemoving(true);
    setError('');

    try {
      const result = await bulkRemoveMembers({
        teamId,
        memberIds: Array.from(selectedIds),
        requestorId: authPlayerId,
      });

      if (result.success) {
        // Clear selection
        setSelectedIds(new Set());
        // Notify parent to refresh context
        onMembersChanged();
        // Reload member list
        await loadMembers();
      } else {
        setError(result.error || 'Failed to remove members');
      }
    } catch (err) {
      setError('Failed to remove members');
      console.error('Remove members error:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  // Members that can be selected (exclude creator)
  const selectableMembers = members.filter(m => m.id !== creatorMembershipId);
  const allSelectableSelected = selectableMembers.length > 0 && selectedIds.size === selectableMembers.length;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="member-list-overlay" onClick={onClose}>
      <div className="member-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="member-list-header">
          <h2>Team Members</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className="member-list-error">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="member-list-loading">
            <span className="loading-spinner">⏳</span>
            <p>Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="member-list-empty">
            <p>No members found</p>
          </div>
        ) : (
          <>
            <div className="member-list-table-container">
              <table className="member-list-table">
                <thead>
                  <tr>
                    <th className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={allSelectableSelected}
                        onChange={toggleSelectAll}
                        disabled={selectableMembers.length === 0}
                      />
                    </th>
                    <th>Player</th>
                    <th>Max Score</th>
                    <th>Games</th>
                    <th>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const isCreator = member.id === creatorMembershipId;
                    const isSelected = selectedIds.has(member.id);

                    return (
                      <tr key={member.id} className={isSelected ? 'selected' : ''}>
                        <td className="checkbox-col">
                          {isCreator ? (
                            <span className="creator-badge">👑</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(member.id)}
                            />
                          )}
                        </td>
                        <td>
                          {member.playerNickname}
                          {isCreator && <span className="role-label"> (Creator)</span>}
                        </td>
                        <td>{member.maxScore.toLocaleString()}</td>
                        <td>{member.gamesCompleted}</td>
                        <td>{formatDate(member.lastActive)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="member-list-footer">
              <button
                className="remove-button"
                onClick={handleRemove}
                disabled={selectedIds.size === 0 || isRemoving}
              >
                {isRemoving ? '⏳ Removing...' : `🗑️ Remove Selected (${selectedIds.size})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
