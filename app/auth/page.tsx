'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, isLoading: authLoading, refresh } = useAuth();
  const router = useRouter();

  // Already logged in → go to dashboard
  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && !name.trim()) { setError('Please enter your name'); return; }
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!password) { setError('Please enter your password'); return; }
    if (mode === 'signup' && password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setIsLoading(true);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const body = mode === 'signup'
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return; }

      await refresh();
      router.push('/dashboard');
    } catch {
      setError('Network error – please try again');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%)' }}
    >
      <div className="max-w-sm w-full mx-auto space-y-6 animate-fade-in-up">

        {/* Logo */}
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 pulse-glow"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-7 h-7">
              <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 14H11v-5H8l4-4 4 4h-3Z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold gradient-text">SplitDay</h1>
          <p className="text-gray-400 text-sm mt-1">
            {mode === 'signup' ? 'Create your account to get started' : 'Welcome back!'}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex rounded-xl overflow-hidden p-1 gap-1"
             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              id={`auth-tab-${m}`}
              onClick={() => { setMode(m); setError(''); }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: mode === m ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
                color: mode === m ? '#fff' : '#6b7280',
                boxShadow: mode === m ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">

          {mode === 'signup' && (
            <div className="space-y-1.5 animate-fade-in-up">
              <label className="text-sm font-medium text-gray-300">Full Name</label>
              <input
                id="auth-name"
                type="text"
                className="input-field"
                placeholder="e.g. Dasun Perera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={50}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Email</label>
            <input
              id="auth-email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Password</label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPw ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" />
                    <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41Z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-rose-400 text-sm animate-fade-in-up" role="alert">⚠ {error}</p>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="btn-brand w-full py-3 text-base"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {mode === 'signup' ? 'Creating account…' : 'Signing in…'}
              </>
            ) : (
              mode === 'signup' ? '🚀 Create Account' : '→ Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs">
          {mode === 'signup'
            ? 'Already have an account? '
            : "Don't have an account? "}
          <button
            onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            {mode === 'signup' ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </main>
  );
}
