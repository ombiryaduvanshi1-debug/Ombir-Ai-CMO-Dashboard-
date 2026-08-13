import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

type AuthMode = 'login' | 'forgot' | 'forgot_success' | 'reset' | 'reset_success';

export const AuthScreen: React.FC = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');

  // Login form state
  const [email, setEmail] = useState('ombiryaduvanshi1@gmail.com');
  const [password, setPassword] = useState('9836447541');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [testResetToken, setTestResetToken] = useState<string | null>(null);

  // Reset password state
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenVerifying, setTokenVerifying] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenEmail, setTokenEmail] = useState<string>('');

  // Status & error states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password rules validation
  const rules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>_]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword
  };

  const isPasswordValid =
    rules.length && rules.uppercase && rules.lowercase && rules.number && rules.special && rules.match;

  // Check URL parameters for password reset token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('resetToken');
    if (token) {
      setResetToken(token);
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (tok: string) => {
    setTokenVerifying(true);
    setError(null);
    try {
      const res = await api.verifyResetToken(tok);
      setTokenValid(true);
      setTokenEmail(res.email);
      setMode('reset');
    } catch (err: any) {
      setTokenValid(false);
      setError(err.message || 'Invalid or expired password reset token.');
      setMode('reset');
    } finally {
      setTokenVerifying(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.forgotPassword(forgotEmail);
      setForgotMsg(res.message);
      if (res.resetToken) {
        setTestResetToken(res.resetToken);
      }
      setMode('forgot_success');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Please fulfill all password security requirements before submitting.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({
        token: resetToken,
        newPassword,
        confirmPassword
      });
      setMode('reset_success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setError(null);
    try {
      await login(demoEmail, demoPass, true);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-xl shadow-indigo-500/20 flex items-center justify-center mx-auto">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <BrainCircuit className="w-7 h-7 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CMO Intelligence Platform</h1>
          <p className="text-xs text-slate-400">Production-Grade Secure Authentication</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium flex items-center gap-2 justify-center">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Registered Email Address</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ombir@omangentic.com"
                  className="w-full bg-slate-800/80 text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-4 py-3 border border-slate-700/80 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setForgotEmail(email);
                    setMode('forgot');
                  }}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-800/80 text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-10 py-3 border border-slate-700/80 focus:border-indigo-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'LOGIN'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Fill Buttons */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">1-Click Quick Admin Sign-In</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('ombiryaduvanshi1@gmail.com', '9836447541')}
                  className="p-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 border border-indigo-500/40 text-xs font-bold text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Log in as Admin (ombiryaduvanshi1@gmail.com)</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('ombir@omangentic.com', '9836447541')}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ombir@omangentic.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('user@cmo.ai', 'user123')}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Growth User</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* 2. FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span>Forgot Password?</span>
              </h2>
              <p className="text-xs text-slate-400">
                Enter your registered email address below. We will send a secure, single-use password reset link.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Enter Registered Email</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="ombir@omangentic.com"
                  className="w-full bg-slate-800/80 text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-4 py-3 border border-slate-700/80 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Generating Link...' : 'Send Password Reset Email'}</span>
              <Mail className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('login');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD SUCCESS */}
        {mode === 'forgot_success' && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">Reset Link Dispatched</h2>
              <p className="text-xs text-slate-300 leading-relaxed">{forgotMsg}</p>
            </div>

            {testResetToken && (
              <div className="p-3 bg-indigo-950/60 border border-indigo-500/30 rounded-xl space-y-2 text-left">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Preview Instant Test Link</p>
                <p className="text-[11px] text-slate-400 truncate">Token: {testResetToken}</p>
                <button
                  type="button"
                  onClick={() => verifyToken(testResetToken)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Open Password Reset Page</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('login');
              }}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </div>
        )}

        {/* 4. RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span>Reset Your Password</span>
              </h2>
              {tokenEmail && <p className="text-xs text-indigo-300 font-medium">Account: {tokenEmail}</p>}
            </div>

            {tokenVerifying ? (
              <div className="text-center py-6 text-xs text-slate-400">Verifying security token...</div>
            ) : tokenValid === false ? (
              <div className="space-y-4 text-center">
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {error || 'This password reset link is invalid or has expired.'}
                </div>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  Request New Reset Link
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">New Password</label>
                  <div className="relative mt-1">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 8 chars with uppercase, lowercase, number & special char"
                      className="w-full bg-slate-800/80 text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-10 py-3 border border-slate-700/80 focus:border-indigo-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Confirm New Password</label>
                  <div className="relative mt-1">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-slate-800/80 text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-10 py-3 border border-slate-700/80 focus:border-indigo-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password Security Requirements</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${rules.length ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {rules.length ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>Min 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${rules.uppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {rules.uppercase ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>1 Uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${rules.lowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {rules.lowercase ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>1 Lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${rules.number ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {rules.number ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>1 Number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${rules.special ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {rules.special ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>1 Special (!@#$)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${rules.match ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {rules.match ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>Passwords Match</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isPasswordValid}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Updating Password...' : 'Reset Password'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* 5. RESET SUCCESS MODE */}
        {mode === 'reset_success' && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">Password Updated Successfully</h2>
              <p className="text-xs text-slate-300">Your password has been reset successfully. You can now log in with your new password.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setNewPassword('');
                setConfirmPassword('');
                setMode('login');
              }}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Back to Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};