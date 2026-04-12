import { Lock, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/dashboard', { replace: true });
    } catch {
      // error shown via store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-deep flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-venue-blue/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-venue-blue/30 bg-venue-blue/10 shadow-lg shadow-venue-blue/20">
            <Zap className="h-7 w-7 text-venue-blue" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">Crowgy</h1>
            <p className="mt-1 text-sm text-slate-400">Staff Operations Dashboard</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-navy-border bg-navy-card p-7 shadow-panel">
          <h2 className="mb-5 text-base font-semibold text-slate-200">Sign in to continue</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-slate-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ops@venue.io"
                className="w-full rounded-xl border border-navy-border bg-navy-elevated px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none ring-0 transition focus:border-venue-blue/60 focus:ring-1 focus:ring-venue-blue/40"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-slate-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-navy-border bg-navy-elevated px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none ring-0 transition focus:border-venue-blue/60 focus:ring-1 focus:ring-venue-blue/40"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-venue-blue px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-venue-blue/30 transition hover:bg-blue-500 disabled:opacity-60"
            >
              <Lock className="h-4 w-4" />
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-600">
          Authorised staff only · Grand Arena Operations
        </p>
      </div>
    </div>
  );
}
