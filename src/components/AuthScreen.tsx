// Authentication Screen Component - Sign In / Sign Up
import { useState } from 'react';
import { signIn, signUp } from '../authService';
import type { AuthUser } from '../types';

type AuthMode = 'signin' | 'signup';

interface AuthScreenProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    if (!password) {
      setError('Please enter a password');
      return;
    }

    // Sign up specific validation
    if (mode === 'signup') {
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      if (username.trim().length > 15) {
        setError('Username must be 15 characters or less');
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
        setError('Username can only contain letters, numbers, _ and -');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const result = await signIn(username.trim(), password);
        if (result.success && result.user) {
          onAuthSuccess(result.user);
        } else {
          setError(result.error || 'Sign in failed');
        }
      } else {
        const result = await signUp(username.trim(), password);
        if (result.success && result.user) {
          onAuthSuccess(result.user);
        } else {
          setError(result.error || 'Sign up failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="auth-screen">
      <h1 className="auth-title">
        <span className="title-math">MATH</span>
        <span className="title-space">SPACE</span>
        <span className="title-invaders">INVADERS</span>
      </h1>

      <div className="auth-card">
        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => switchMode('signin')}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="auth-input"
              maxLength={15}
              autoFocus
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="auth-input"
              disabled={isLoading}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'signup' && (
            <div className="auth-input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="auth-input"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              '...'
            ) : mode === 'signin' ? (
              '🚀 Sign In & Play'
            ) : (
              '🎮 Create Account'
            )}
          </button>
        </form>

        <p className="auth-hint">
          {mode === 'signin'
            ? "Don't have an account? Click Sign Up above!"
            : 'Your scores will be saved to the global leaderboard!'}
        </p>
      </div>
    </div>
  );
}
