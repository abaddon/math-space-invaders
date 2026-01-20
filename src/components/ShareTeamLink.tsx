import { useState } from 'react';
import type { Team } from '../types';
import './ShareTeamLink.css';

interface ShareTeamLinkProps {
  team: Team;
  password?: string;
}

export function ShareTeamLink({ team, password }: ShareTeamLinkProps) {
  const [copied, setCopied] = useState(false);

  // Build shareable URL
  const baseUrl = `${window.location.origin}/math-space-invaders/team/${team.slug}`;
  const shareableUrl = password ? `${baseUrl}#${password}` : baseUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback: select the text
      const input = document.getElementById('shareable-link-input') as HTMLInputElement;
      if (input) {
        input.select();
      }
    }
  };

  return (
    <div className="share-team-link">
      <h3>Team Created Successfully!</h3>
      <p className="team-name">{team.name}</p>

      <div className="link-container">
        <label htmlFor="shareable-link-input">Shareable Link:</label>
        <input
          id="shareable-link-input"
          type="text"
          value={shareableUrl}
          readOnly
          onClick={(e) => e.currentTarget.select()}
          className="link-input"
        />
        <button
          onClick={handleCopy}
          className={`copy-button ${copied ? 'copied' : ''}`}
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>

      {password && (
        <p className="warning-text">
          ⚠️ This link contains the team password. Only share with trusted members.
        </p>
      )}

      <p className="info-text">
        Share this link with others to let them join your team.
      </p>
    </div>
  );
}
