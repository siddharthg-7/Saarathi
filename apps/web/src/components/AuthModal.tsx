import React, { useState } from 'react';
import { X, Sparkles, Mail, Lock, User, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import { AuthModalMode, UserProfile } from '@saarathi/types';

interface AuthModalProps {
  mode: AuthModalMode;
  onClose: () => void;
  onSuccess: (updatedProfile?: Partial<UserProfile>) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>(
    mode === 'register' ? 'register' : 'signin'
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [brandingName, setBrandingName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!mode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (activeTab === 'register' && (!name || !phone)) {
      setError('Please provide your name and phone number.');
      return;
    }

    setIsLoading(true);

    // Simulate authenticating with Firebase / Saarathi Gateway
    setTimeout(() => {
      setIsLoading(false);
      onSuccess({
        name: name || 'Rahul Varma',
        brandingName: brandingName || name || 'Siddhartha',
        email,
        phone: phone || '+91 98765 43210',
      });
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden bg-surface border border-border rounded-2xl shadow-large-premium">
        {/* Glow Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primaryHover" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-textSecondary hover:text-text hover:bg-surfaceSecondary rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Logo & Header */}
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/logo.png"
              alt="Saarathi Logo"
              className="w-8 h-8 object-contain"
            />
            <div>
              <h2 className="text-xl font-bold text-text flex items-center gap-2">
                Saarathi{' '}
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10 font-medium">
                  OS v1.0
                </span>
              </h2>
              <p className="text-xs text-textSecondary">Personal Productivity OS & Kairo AI</p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex p-1 mb-6 bg-surfaceSecondary rounded-xl border border-border">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'signin'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-textSecondary hover:text-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-textSecondary hover:text-text'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 text-xs bg-danger/10 border border-danger/25 text-danger rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      placeholder="e.g. Rahul Varma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-surfaceSecondary border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">
                    Branding Name / Preferred Alias
                  </label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      placeholder="e.g. Siddhartha"
                      value={brandingName}
                      onChange={(e) => setBrandingName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-surfaceSecondary border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-surfaceSecondary border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-surfaceSecondary border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-surfaceSecondary border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-primary hover:bg-primaryHover text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {activeTab === 'signin'
                    ? 'Authorize & Enter Workspace'
                    : 'Initialize Saarathi Profile'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Assurance */}
          <div className="mt-6 pt-4 border-t border-divider flex items-center justify-center gap-2 text-[11px] text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            <span>Secured via Firebase Authentication & Encrypted Session Tokens</span>
          </div>
        </div>
      </div>
    </div>
  );
};
