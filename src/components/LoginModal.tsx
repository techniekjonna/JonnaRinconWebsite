import React, { useEffect, useRef, useState } from 'react';
import { X, Music2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

type ModalMode = 'welcome' | 'login' | 'register';

export default function LoginModal({ isOpen, onClose, title, description }: LoginModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<ModalMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('welcome');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
      setError('');
    }
  }, [isOpen]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await signIn(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const user = await signUp(email, password, displayName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/[0.1] hover:bg-white/[0.15] rounded-full text-white/60 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Welcome Screen */}
          {mode === 'welcome' && (
            <div className="text-center">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                  <Music2 className="w-8 h-8 text-red-500" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">
                {title ?? 'Sign In to Listen'}
              </h2>

              {/* Message */}
              <div className="mb-8">
                <p className="text-white/60 text-sm mb-4">
                  {description ?? 'Access all tracks and support the artist directly'}
                </p>

                {/* Benefits */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <span className="text-white/70 text-xs">Free Access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <span className="text-white/70 text-xs">Ad-Free Listening</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <span className="text-white/70 text-xs">High Quality Audio</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <span className="text-white/70 text-xs">Support the Artist</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => setMode('login')}
                  className="w-full px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode('register')}
                  className="w-full px-6 py-3.5 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.12] text-white rounded-xl font-bold uppercase tracking-wider transition-all"
                >
                  Create Account
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full mt-4 px-6 py-2 text-white/40 hover:text-white/70 text-xs font-bold uppercase tracking-wider transition-all"
              >
                Maybe Later
              </button>
            </div>
          )}

          {/* Login Screen */}
          {mode === 'login' && (
            <div>
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Welcome Back</h2>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-white/80 mb-2">
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.15] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/[0.3] focus:bg-white/[0.1]"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-white/80 mb-2">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.15] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/[0.3] focus:bg-white/[0.1]"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white py-2.5 rounded-lg font-bold uppercase tracking-wider transition-all disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-white/60">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className="text-red-400 hover:text-red-300 font-semibold"
                  >
                    Create one
                  </button>
                </p>
                <button
                  onClick={() => {
                    setMode('welcome');
                    setError('');
                  }}
                  className="text-sm text-white/40 hover:text-white/70 font-semibold"
                >
                  Back to menu
                </button>
              </div>
            </div>
          )}

          {/* Register Screen */}
          {mode === 'register' && (
            <div>
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Create Account</h2>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-white/80 mb-2">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.15] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/[0.3] focus:bg-white/[0.1]"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-white/80 mb-2">
                    Email Address
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.15] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/[0.3] focus:bg-white/[0.1]"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium text-white/80 mb-2">
                    Password
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.15] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/[0.3] focus:bg-white/[0.1]"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.15] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/[0.3] focus:bg-white/[0.1]"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white py-2.5 rounded-lg font-bold uppercase tracking-wider transition-all disabled:opacity-60"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-white/60">
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    className="text-red-400 hover:text-red-300 font-semibold"
                  >
                    Sign in
                  </button>
                </p>
                <button
                  onClick={() => {
                    setMode('welcome');
                    setError('');
                  }}
                  className="text-sm text-white/40 hover:text-white/70 font-semibold"
                >
                  Back to menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
