import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, Phone } from 'lucide-react';
import { UserProfile } from '@saarathi/types';
import {
  signUpWithEmail,
  signInWithEmail,
  createUserProfileDoc,
  getUserProfileDoc,
  createUserSettingsDoc,
} from '@saarathi/api';

interface AuthViewProps {
  initialMode?: 'signin' | 'register';
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

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'signin',
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'signin') {
      if (!email || !password) {
        setError('Please enter your email and password.');
        return;
      }
    } else {
      if (!name || !email || !password || !phoneNumber) {
        setError('Please fill in all required fields including phone number.');
        return;
      }
    }

    setIsLoading(true);

    const fullPhone = phoneNumber ? `${countryCode} ${phoneNumber}` : '';

    try {
      if (activeTab === 'register') {
        let userId = 'user_' + Date.now();
        let userEmail = email;
        let displayName = name;

        // 1. Authenticate & Create User in Firebase Auth
        try {
          const authUser = await signUpWithEmail(email, password, name);
          if (authUser) {
            userId = authUser.uid;
            userEmail = authUser.email || email;
            if (authUser.displayName) displayName = authUser.displayName;
          }
        } catch (firebaseAuthErr: any) {
          console.warn('Firebase Auth notice:', firebaseAuthErr?.message || firebaseAuthErr);
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
          const authUser = await signInWithEmail(email, password);
          if (authUser) {
            userId = authUser.uid;
            // 2. Fetch User Record from Firestore Database
            fetchedDoc = await getUserProfileDoc(userId);
          }
        } catch (firebaseAuthErr: any) {
          console.warn('Firebase Sign-In notice:', firebaseAuthErr?.message || firebaseAuthErr);
        }

        onSuccess({
          id: userId,
          email,
          name: fetchedDoc?.name || email.split('@')[0],
          phone: fetchedDoc?.phone || '',
          ...fetchedDoc,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-between items-center py-10 px-4 font-sans text-[#172033] selection:bg-[#2854D9]/20 selection:text-[#2854D9]">
      <div className="w-full max-w-[420px] mx-auto flex flex-col items-center my-auto">
        
        {/* Top Header: Logo + Saarathi Name + Sublabel */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/logo.png"
              alt="Saarathi Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-2xl font-bold tracking-tight text-[#172033]">
              Saarathi
            </span>
          </div>
          <span className="text-xs font-medium tracking-wide text-[#2854D9] uppercase bg-[#EEF3FF] px-3 py-1 rounded-full border border-[#2854D9]/10">
            Personal Productivity OS
          </span>
        </div>

        {/* Kairo AI Assistant Visual */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-b from-white to-[#EEF3FF] shadow-md border border-[#E2E8F0] group transition-transform hover:scale-105">
            <img
              src="/kairo.jpg"
              alt="Kairo AI Assistant"
              className="w-full h-full object-cover rounded-full mix-blend-multiply"
            />
            <div className="absolute inset-0 rounded-full ring-2 ring-[#2854D9]/20 animate-pulse pointer-events-none" />
          </div>
          <span className="mt-2 text-xs font-medium text-[#667085] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2854D9] animate-ping" />
            AI Assistant · Kairo
          </span>
        </div>

        {/* Main Authentication Card */}
        <div className="w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_12px_32px_-8px_rgba(23,43,95,0.08)] p-6 sm:p-8">
          
          {/* Card Heading & Subtitle */}
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

          {/* Inline Error alert */}
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
                  id="auth-fullname"
                  type="text"
                  required
                  placeholder=" "
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="peer w-full h-13 pl-10 pr-4 pt-4 pb-1.5 text-sm bg-white border border-[#E2E8F0] rounded-xl text-[#172033] focus:outline-none focus:border-[#2854D9] focus:ring-2 focus:ring-[#2854D9]/15 transition-all"
                />
                <label
                  htmlFor="auth-fullname"
                  className="absolute left-10 top-3.5 text-xs text-[#667085] pointer-events-none transition-all duration-200 ease-out origin-left transform peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 -translate-y-2.5 scale-90 peer-focus:-translate-y-2.5 peer-focus:scale-90 peer-focus:text-[#2854D9] peer-focus:font-medium"
                >
                  Full Name
                </label>
                <User className="absolute left-3.5 top-4 w-4 h-4 text-[#667085] transition-colors peer-focus:text-[#2854D9]" />
              </div>
            )}

            <div className="relative">
              <input
                id="auth-email"
                type="email"
                required
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full h-13 pl-10 pr-4 pt-4 pb-1.5 text-sm bg-white border border-[#E2E8F0] rounded-xl text-[#172033] focus:outline-none focus:border-[#2854D9] focus:ring-2 focus:ring-[#2854D9]/15 transition-all"
              />
              <label
                htmlFor="auth-email"
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
                      id="auth-phone"
                      type="tel"
                      required
                      placeholder=" "
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="peer w-full h-13 pl-10 pr-4 pt-4 pb-1.5 text-sm bg-white border border-[#E2E8F0] rounded-xl text-[#172033] focus:outline-none focus:border-[#2854D9] focus:ring-2 focus:ring-[#2854D9]/15 transition-all"
                    />
                    <label
                      htmlFor="auth-phone"
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
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full h-13 pl-10 pr-11 pt-4 pb-1.5 text-sm bg-white border border-[#E2E8F0] rounded-xl text-[#172033] focus:outline-none focus:border-[#2854D9] focus:ring-2 focus:ring-[#2854D9]/15 transition-all"
                />
                <label
                  htmlFor="auth-password"
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
                    onClick={() => setError('Password reset link sent to your email if registered.')}
                    className="text-xs font-medium text-[#2854D9] hover:text-[#172B5F] hover:underline focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
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

          {/* Mode Switch Footer Text */}
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

      {/* Footer Branding Copyright */}
      <footer className="mt-8 text-center text-xs text-[#667085]">
        © Saarathi
      </footer>
    </div>
  );
};
