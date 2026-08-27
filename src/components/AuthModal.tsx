import React, { useState } from "react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from "../firebase";
import {
  X,
  User as UserIcon,
  Cloud,
  CheckCircle2,
  Lock,
  Mail,
  LogOut,
  Shield,
  Loader2,
  Sparkles,
  Database,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { horologyAudio } from "../utils/audio";

interface AuthModalProps {
  currentUser: User | null;
  onClose: () => void;
  onSyncLocalToCloud?: () => Promise<void>;
  watchCount: number;
  collectionCount: number;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  onClose,
  onSyncLocalToCloud,
  watchCount,
  collectionCount,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await signInWithPopup(auth, googleProvider);
      horologyAudio.playCaseLid();
      setSuccessMessage("Signed in successfully with Google!");
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setErrorMessage(err.message || "Failed to sign in with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await signInAnonymously(auth);
      horologyAudio.playCaseLid();
      setSuccessMessage("Personal guest cloud vault created!");
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      console.error("Guest sign-in error:", err);
      setErrorMessage(err.message || "Failed to create guest cloud vault.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMessage("Collector account created and vitrine saved to cloud!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMessage("Signed in to your private collector vitrine!");
      }
      horologyAudio.playCaseLid();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      console.error("Email auth error:", err);
      setErrorMessage(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      horologyAudio.playCrownClick();
      setSuccessMessage("Signed out safely.");
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign out.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!onSyncLocalToCloud) return;
    setIsSyncing(true);
    try {
      await onSyncLocalToCloud();
      horologyAudio.playCrownClick();
      setSuccessMessage("All vitrines and timepieces successfully synced to cloud!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage("Sync failed: " + (err.message || "Unknown error"));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      id="auth-cloud-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-neutral-900 via-neutral-950 to-black rounded-3xl border border-neutral-800 shadow-2xl p-6 sm:p-8 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-auth-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg shadow-amber-500/10">
            <Cloud size={24} />
          </div>
          <h2 className="text-xl font-serif font-bold text-neutral-100">
            {currentUser ? "Personal Collector Vault" : "Cloud Save & Sync"}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {currentUser
              ? "Your vitrines and timepieces are permanently saved to your cloud account."
              : "Sign in to save your custom watch collections and custom vitrines across devices so you never have to re-enter anything."}
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* 1. SIGNED-IN PROFILE VIEW */}
        {currentUser ? (
          <div className="space-y-5">
            {/* User Info Card */}
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-3.5">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border-2 border-amber-500/40 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-base">
                  {currentUser.displayName
                    ? currentUser.displayName[0].toUpperCase()
                    : currentUser.email
                    ? currentUser.email[0].toUpperCase()
                    : "C"}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-neutral-100 truncate">
                  {currentUser.displayName || (currentUser.isAnonymous ? "Guest Collector" : "Authenticated Member")}
                </h4>
                <p className="text-xs text-neutral-400 truncate">
                  {currentUser.email || (currentUser.isAnonymous ? "Local Guest Session" : currentUser.uid)}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Cloud Persistence Active</span>
                </div>
              </div>
            </div>

            {/* Storage Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-mono block">Saved Timepieces</span>
                <span className="text-base font-bold text-amber-300">{watchCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-mono block">Active Vitrines</span>
                <span className="text-base font-bold text-amber-300">{collectionCount}</span>
              </div>
            </div>

            {/* Sync Now Button */}
            <button
              id="sync-now-cloud-btn"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-2 transition-colors"
            >
              {isSyncing ? (
                <>
                  <Loader2 size={14} className="animate-spin text-amber-400" />
                  <span>Syncing to Firestore...</span>
                </>
              ) : (
                <>
                  <Database size={14} className="text-amber-400" />
                  <span>Force Cloud Backup & Sync</span>
                </>
              )}
            </button>

            {/* Sign Out Button */}
            <button
              id="sign-out-btn"
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut size={14} />
              <span>Sign Out of Account</span>
            </button>
          </div>
        ) : (
          /* 2. SIGN-IN / SIGN-UP FORM VIEW */
          <div className="space-y-4">
            {/* Google Sign In Button */}
            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Quick Guest Vault Button */}
            <button
              id="guest-vault-btn"
              onClick={handleAnonymousSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <UserCheck size={14} className="text-amber-400" />
              <span>Instant Guest Cloud Vault (No Password)</span>
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-neutral-950 px-2 text-neutral-500">Or with Email</span>
              </div>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="collector@hautehorlogerie.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    id="auth-password-input"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                id="submit-email-auth-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 active:scale-98 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? "Create Vault & Save" : "Sign In & Load Vault"}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                id="toggle-auth-mode-btn"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage("");
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                {isSignUp
                  ? "Already have a collector account? Sign In"
                  : "Need a personal vault account? Create One"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
