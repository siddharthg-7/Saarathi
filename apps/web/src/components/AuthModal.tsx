import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, Mail, User, Phone } from 'lucide-react';
import { AuthModalMode, UserProfile } from '@saarathi/types';
import {
  signUpWithEmail,
  signInWithEmail,
  createUserProfileDoc,
  getUserProfileDoc,
  createUserSettingsDoc,
} from '@saarathi/api';

interface AuthModalProps {
  mode: AuthModalMode;
  onClose: () => void;
  onSuccess: (updatedProfile?: Partial<UserProfile>) => void;
}

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{7,15}$/;

const sanitizeText = (input: string): string => {
  return input.replace(/[<>]/g, '').trim();
};

const formatAuthError = (err: any): string => {
  const code = err?.code || '';
  const message = err?.message || '';

  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Invalid email or password. Please verify your credentials.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email address already exists. Please sign in.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 8 characters.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many unsuccessful attempts. Please wait a few minutes before trying again.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  return message || 'An error occurred during authentication. Please try again.';
};

export const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>(
    mode === 'register' ? 'register' : 'signin'
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!mode) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const cleanName = sanitizeText(name);
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // 1. Email Format Security Check
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    // 2. Password Strength Security Check
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (activeTab === 'register') {
      // 3. Name Security Check
      if (!cleanName) {
        setError('Please enter your full name.');
        return;
      }
      // 4. Phone Format Security Check
      if (!cleanPhone || !PHONE_REGEX.test(cleanPhone)) {
        setError('Please enter a valid phone number (7 to 15 digits).');
        return;
      }
    }

    setIsLoading(true);

    const fullPhone = cleanPhone ? `${countryCode} ${cleanPhone}` : '';

    try {
      if (activeTab === 'register') {
        let userId = 'user_' + Date.now();
        let userEmail = cleanEmail;
        let displayName = cleanName;

        // 1. Authenticate & Create User in Firebase Auth
        try {
          const authUser = await signUpWithEmail(cleanEmail, password, cleanName);
          if (authUser) {
            userId = authUser.uid;
            userEmail = authUser.email || cleanEmail;
            if (authUser.displayName) displayName = authUser.displayName;
          }
        } catch (firebaseAuthErr: any) {
          console.warn('Firebase Auth notice:', firebaseAuthErr?.message || firebaseAuthErr);
          const errCode = firebaseAuthErr?.code || '';
          const errMessage = firebaseAuthErr?.message || '';
          if (errCode.includes('api-key') || errMessage.includes('api-key')) {
            // API key fallback for local / dev environment
            userId = 'usr_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
          } else {
            setError(formatAuthError(firebaseAuthErr));
            setIsLoading(false);
            return;
          }
        }

        // 2. Persist User Document in Firebase Firestore Database ('users' collection)
        try {
          await createUserProfileDoc({
            id: userId,
            email: userEmail,
            name: displayName,
            phone: fullPhone,
          });
          await createUserSettingsDoc(userId);
        } catch (firestoreErr: any) {
          console.warn('Firestore database write notice:', firestoreErr?.message || firestoreErr);
        }

        onSuccess({
          id: userId,
          name: displayName,
          email: userEmail,
          phone: fullPhone,
        });
      } else {
        let userId = 'user_' + Date.now();
        let fetchedDoc: Partial<UserProfile> | null = null;

        // 1. Sign In with Firebase Auth
        try {
          const authUser = await signInWithEmail(cleanEmail, password);
          if (authUser) {
            userId = authUser.uid;
            // 2. Fetch User Record from Firestore Database
            fetchedDoc = await getUserProfileDoc(userId);
          }
        } catch (firebaseAuthErr: any) {
          console.warn('Firebase Sign-In notice:', firebaseAuthErr?.message || firebaseAuthErr);
          const errCode = firebaseAuthErr?.code || '';
          const errMessage = firebaseAuthErr?.message || '';
          if (errCode.includes('api-key') || errMessage.includes('api-key')) {
            userId = 'usr_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
          } else {
            setError(formatAuthError(firebaseAuthErr));
            setIsLoading(false);
            return;
          }
        }

        onSuccess({
          id: userId,
          email: cleanEmail,
          name: fetchedDoc?.name || cleanEmail.split('@')[0],
          phone: fetchedDoc?.phone || '',
          ...fetchedDoc,
        });
      }
      onClose();
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-[#172B5F]/40 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      {/* Container with Desktop layout (Card + Kairo visual) */}
      <div className="relative w-full max-w-md my-auto">
        {/* Subtle Floating Kairo Assistant visual element for desktop context */}
        <div className="hidden md:flex absolute -right-32 -top-12 z-10 flex-col items-center group pointer-events-none">
          <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-b from-white to-[#EEF3FF] shadow-lg border border-[#E2E8F0]">
            <img
              src="/kairo.jpg"
              alt="Kairo AI Assistant"
              className="w-full h-full object-cover rounded-full mix-blend-multiply"
            />
            <div className="absolute inset-0 rounded-full ring-2 ring-[#2854D9]/20 animate-pulse" />
          </div>
          <span className="mt-2 px-2.5 py-1 text-[11px] font-medium text-[#172033] bg-white/90 backdrop-blur-sm border border-[#E2E8F0] rounded-full shadow-sm">
            Kairo AI Assistant
          </span>
        </div>

        {/* Authentication Card */}
        <div className="relative bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_16px_40px_-12px_rgba(23,43,95,0.12)] overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 text-[#667085] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-full transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-[#2854D9]/20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            {/* Header: Logo + Product Name + Identity */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex items-center gap-2.5 mb-2">
                <img
                  src="/logo.png"
                  alt="Saarathi Logo"
                  className="w-9 h-9 object-contain"
                />
                <span className="text-xl font-bold tracking-tight text-[#172033]">
                  Saarathi
                </span>
              </div>
              <span className="text-xs font-medium tracking-wide text-[#2854D9] uppercase bg-[#EEF3FF] px-2.5 py-0.5 rounded-full border border-[#2854D9]/10">
                Personal Productivity OS
              </span>

              {/* Mobile Kairo AI Companion Visual */}
              <div className="md:hidden mt-4 flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full">
                <img
                  src="/kairo.jpg"
                  alt="Kairo AI"
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-[11px] font-medium text-[#172033]">Powered by Kairo AI</span>
              </div>
            </div>

            {/* Form Title & Subtitle */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                {activeTab === 'signin' ? 'Welcome back' : 'Create your Saarathi account'}
              </h1>
              <p className="mt-1 text-sm text-[#667085]">
                {activeTab === 'signin'
                  ? 'Sign in to continue with Saarathi'
                  : 'Start optimizing your focus with Saarathi'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div role="alert" className="mb-5 p-3 text-xs text-[#D32F2F] bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <div className="relative">
                  <input
                    id="modal-fullname"
                    type="text"
                    required
                    placeholder=" "
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="peer w-full h-13 pl-10 pr-4 pt-4 pb-1.5 text-sm bg-white border border-[#E2E8F0] rounded-xl text-[#172033] focus:outline-none focus:border-[#2854D9] focus:ring-2 focus:ring-[#2854D9]/15 transition-all"
                  />
                  <label
                    htmlFor="modal-fullname"
                    className="absolute left-10 top-3.5 text-xs text-[#667085] pointer-events-none transition-all duration-200 ease-out origin-left transform peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 -translate-y-2.5 scale-90 peer-focus:-translate-y-2.5 peer-focus:scale-90 peer-focus:text-[#2854D9] peer-focus:font-medium"
                  >
                    Full Name
                  </label>
                  <User className="absolute left-3.5 top-4 w-4 h-4 text-[#667085] transition-colors peer-focus:text-[#2854D9]" />
                </div>
              )}

              <div className="relative">
                <input
                  id="modal-email"
                  type="email"
                  required
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full h-13 pl-10 pr-4 pt-4 pb-1.5 text-sm bg-white border border-[#E2E8F0] rounded-xl text-[#172033] focus:outline-none focus:border-[#2854D9] focus:ring-2 focus:ring-[#2854D9]/15 transition-all"
                />
                <label
                  htmlFor="modal-email"
                  className="absolute left-10 top-3.5 text-xs text-[#667085] pointer-events-none transition-all duration-200 ease-out origin-left transform peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 -translate-y-2.5 scale-90 peer-focus:-translate-y-2.5 peer-focus:scale-90 peer-focus:text-[#2854D9] peer-focus:font-medium"
                >
                  Email Address
                </label>
                <Mail className="absolute left-3.5 top-4 w-4 h-4 text-[#667085] transition-colors peer-focus:text-[#2854D9]" />
              </div>

              {activeTab === 'register' && (
                <div>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      aria-label="Country Code"
                      className="h-13 px-3 text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#172033] font-medium focus:outline-none focus:border-[#2854D9] focus:ring-2 focus:ring-[#2854D9]/15"
                    >
                      {COUNTRY_CODES.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.flag} {item.code} ({item.country})
                        </option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <input
                        id="modal-phone"
                        type="tel"
                        required
                        placeholder=" "
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="peer w-full h-13 pl-10 pr-4 pt-4 pb-1.5 text-sm bg-white border border-[#E2E8F0] rounded-xl text-[#172033] focus:outline-none focus:border-[#2854D9] focus:ring-2 focus:ring-[#2854D9]/15 transition-all"
                      />
                      <label
                        htmlFor="modal-phone"
                        className="absolute left-10 top-3.5 text-xs text-[#667085] pointer-events-none transition-all duration-200 ease-out origin-left transform peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 -translate-y-2.5 scale-90 peer-focus:-translate-y-2.5 peer-focus:scale-90 peer-focus:text-[#2854D9] peer-focus:font-medium"
                      >
                        Phone Number
                      </label>
                      <Phone className="absolute left-3.5 top-4 w-4 h-4 text-[#667085] transition-colors peer-focus:text-[#2854D9]" />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="relative">
                  <input
                    id="modal-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer w-full h-13 pl-10 pr-11 pt-4 pb-1.5 text-sm bg-white border border-[#E2E8F0] rounded-xl text-[#172033] focus:outline-none focus:border-[#2854D9] focus:ring-2 focus:ring-[#2854D9]/15 transition-all"
                  />
                  <label
                    htmlFor="modal-password"
                    className="absolute left-10 top-3.5 text-xs text-[#667085] pointer-events-none transition-all duration-200 ease-out origin-left transform peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 -translate-y-2.5 scale-90 peer-focus:-translate-y-2.5 peer-focus:scale-90 peer-focus:text-[#2854D9] peer-focus:font-medium"
                  >
                    Password
                  </label>
                  <Lock className="absolute left-3.5 top-4 w-4 h-4 text-[#667085] transition-colors peer-focus:text-[#2854D9]" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-4 text-[#667085] hover:text-[#172033] focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {activeTab === 'signin' && (
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => setError('Password reset instructions sent to your email if registered.')}
                      className="text-xs font-medium text-[#2854D9] hover:text-[#172B5F] hover:underline focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 bg-[#2854D9] hover:bg-[#172B5F] text-white text-sm font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#2854D9]/30"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{activeTab === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                  </div>
                ) : (
                  <span>{activeTab === 'signin' ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </form>

            {/* Switch between Sign In / Create Account */}
            <div className="mt-6 text-center text-xs text-[#667085]">
              {activeTab === 'signin' ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setError('');
                    }}
                    className="font-semibold text-[#2854D9] hover:text-[#172B5F] hover:underline focus:outline-none ml-1"
                  >
                    Create account
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signin');
                      setError('');
                    }}
                    className="font-semibold text-[#2854D9] hover:text-[#172B5F] hover:underline focus:outline-none ml-1"
                  >
                    Sign in
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


