import React, { useState } from 'react';
import { User, UserRole } from '../types/index.js';
import { authService } from '../services/auth.js';
import { HeartPulse, Eye, EyeOff, ShieldAlert, Sparkles, UserCheck, Stethoscope, Ambulance, ShieldCheck, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim() || !email.trim() || !password) {
          throw new Error('Please fill in all required fields');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        const res = await authService.register({
          name,
          email,
          phone: phone || '+919876543210',
          password,
          role: 'patient'
        });
        onLoginSuccess(res.user);
      } else {
        if (!email.trim() || !password) {
          throw new Error('Please enter both email and password');
        }
        const res = await authService.login(email, password);
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    const demoUser = authService.demoLogin(role);
    onLoginSuccess(demoUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-teal-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-left relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600/20 border border-teal-500/40 rounded-2xl text-teal-400 mb-1 shadow-inner">
            <HeartPulse className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit tracking-tight">
            Care<span className="text-teal-400">Flow</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Connected Multi-User Healthcare Ecosystem
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. patient.demo@careflow.app"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isRegistering && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : isRegistering ? 'Create Account & Sign In' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Create Account"}
          </button>
        </div>

        {/* Demo Accounts Section */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Demo Accounts Quick Access
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('patient')}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4 shrink-0 text-teal-400" />
              <div className="text-left truncate">
                <div>Patient</div>
                <div className="text-[10px] text-slate-400 font-normal truncate">Rajesh Kumar</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('doctor')}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 shrink-0 text-teal-400" />
              <div className="text-left truncate">
                <div>Doctor</div>
                <div className="text-[10px] text-slate-400 font-normal truncate">Dr. Anil Sharma</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('staff')}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Ambulance className="w-4 h-4 shrink-0 text-teal-400" />
              <div className="text-left truncate">
                <div>EMT / Staff</div>
                <div className="text-[10px] text-slate-400 font-normal truncate">Operations</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('hospital_admin')}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-teal-400" />
              <div className="text-left truncate">
                <div>Admin</div>
                <div className="text-[10px] text-slate-400 font-normal truncate">Hospital Director</div>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
