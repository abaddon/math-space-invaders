import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTeam } from '../contexts/TeamContext';
import './MyTeamsDropdown.css';

export function MyTeamsDropdown() {
  const { myTeams, isLoadingTeams } = useTeam();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  if (isLoadingTeams) {
    return <div className="my-teams-dropdown">Loading...</div>;
  }

  return (
    <div className="my-teams-dropdown" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="dropdown-trigger"
      >
        👥 My Teams ({myTeams.length})
      </button>

      {isOpen && (
        <div className="dropdown-menu" role="menu" aria-label="My teams">
          {myTeams.length === 0 ? (
            <div className="dropdown-empty" role="menuitem">
              No teams yet. Create or join a team!
            </div>
          ) : (
            myTeams.map((membership) => (
              <Link
                key={membership.id}
                to={`/team/${membership.teamSlug}`}
                className="dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                {membership.teamName}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
