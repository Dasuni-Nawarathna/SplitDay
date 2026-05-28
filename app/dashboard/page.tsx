'use client';

import { useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface Trip {
  _id: string;
  name: string;
  inviteCode: string;
  participants: string[];
  createdAt: string;
}

// ── Avatar colour helper ──────────────────────────────────────────────────────
const COLOURS = ['#7c3aed', '#db2777', '#0891b2', '#059669', '#d97706', '#dc2626'];
function avatarColour(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLOURS[Math.abs(h) % COLOURS.length];
}

export default function Dashboard() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [outingName, setOutingName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading, router]);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch('/api/trips');
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips ?? []);
      }
    } finally {
      setTripsLoading(false);
    }
  }, []);

  useEffect(() => { if (user) fetchTrips(); }, [user, fetchTrips]);

  // ── Participant helpers ──────────────────────────────────────────────────────
  const addParticipant = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    if (participants.includes(trimmed)) { setFormError(`"${trimmed}" already added`); return; }
    setParticipants((p) => [...p, trimmed]);
    setNameInput('');
    setFormError('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addParticipant(); }
  };

  const removeParticipant = (name: string) =>
    setParticipants((prev) => prev.filter((p) => p !== name));

  // ── Create outing ────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setFormError('');
    if (!outingName.trim()) { setFormError('Give the outing a name'); return; }
    if (participants.length < 1) { setFormError('Add at least 1 other person'); return; }

    setCreating(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: outingName.trim(), participants }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? 'Failed to create outing'); return; }
      router.push(`/trip/${data.trip._id}`);
    } catch {
      setFormError('Network error – please try again');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setOutingName('');
    setNameInput('');
    setParticipants([]);
    setFormError('');
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main
      className="min-h-dvh pb-10"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 65%)' }}
    >
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold gradient-text">SplitDay</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              Hey, <span className="text-violet-300 font-medium">{user?.name}</span> 👋
            </p>
          </div>
          <button
            id="logout-btn"
            onClick={logout}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Log out
          </button>
        </div>

        {/* ── New Outing Form (slide-in) ───────────────────────────────────── */}
        {showForm ? (
          <div className="glass-card p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">New Outing</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">Outing Name</label>
              <input
                id="outing-name"
                type="text"
                className="input-field"
                placeholder="e.g. Galle Road Trip 🏖️"
                value={outingName}
                onChange={(e) => setOutingName(e.target.value)}
                maxLength={60}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">Add Group Members</label>
              <div className="flex gap-2">
                <input
                  id="participant-input"
                  type="text"
                  className="input-field flex-1"
                  placeholder="Name, then press Enter"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={30}
                />
                <button
                  onClick={addParticipant}
                  id="add-participant-btn"
                  className="btn-brand px-4 shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                </button>
              </div>

              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {participants.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm text-violet-300"
                      style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
                    >
                      {name}
                      <button onClick={() => removeParticipant(name)} className="hover:text-rose-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {formError && <p className="text-rose-400 text-sm animate-fade-in-up">⚠ {formError}</p>}

            <button
              id="create-outing-btn"
              onClick={handleCreate}
              disabled={creating}
              className="btn-brand w-full py-3"
            >
              {creating ? (
                <>
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating…
                </>
              ) : '🚀 Start Outing'}
            </button>
          </div>
        ) : (
          <button
            id="new-outing-btn"
            onClick={() => setShowForm(true)}
            className="btn-brand w-full py-3 text-base"
          >
            + New Outing
          </button>
        )}

        {/* ── My Outings ──────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            My Outings
          </h2>

          {tripsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : trips.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-4xl mb-3">🧳</p>
              <p className="text-gray-400 text-sm font-medium">No outings yet</p>
              <p className="text-gray-600 text-xs mt-1">Tap "+ New Outing" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <button
                  key={trip._id}
                  id={`trip-card-${trip._id}`}
                  onClick={() => router.push(`/trip/${trip._id}`)}
                  className="w-full glass-card p-4 flex items-center gap-4 text-left hover:scale-[1.01] transition-transform active:scale-[0.99]"
                  style={{ borderRadius: '1rem' }}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-lg"
                    style={{ background: avatarColour(trip.name) }}
                  >
                    {trip.name[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{trip.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {trip.participants.length} member{trip.participants.length !== 1 ? 's' : ''}
                      {' · '}
                      <span className="font-mono text-violet-400">{trip.inviteCode}</span>
                    </p>
                    <div className="flex mt-1.5 -space-x-1">
                      {trip.participants.slice(0, 5).map((p) => (
                        <div
                          key={p}
                          title={p}
                          className="w-5 h-5 rounded-full border border-gray-900 flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: avatarColour(p) }}
                        >
                          {p[0].toUpperCase()}
                        </div>
                      ))}
                      {trip.participants.length > 5 && (
                        <div className="w-5 h-5 rounded-full border border-gray-900 flex items-center justify-center text-gray-400 text-xs"
                             style={{ background: 'rgba(255,255,255,0.08)' }}>
                          +{trip.participants.length - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                       className="w-4 h-4 text-gray-600 shrink-0">
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
