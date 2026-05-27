'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const [outingName, setOutingName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedTripId, setSavedTripId] = useState<string | null>(null);

  // Phase 5: Restore active session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('splitday_active_trip');
    if (saved) setSavedTripId(saved);
  }, []);

  // ── Participant helpers ────────────────────────────────────────────────────
  const addParticipant = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    if (participants.includes(trimmed)) {
      setError(`"${trimmed}" is already added`);
      return;
    }
    setParticipants((prev) => [...prev, trimmed]);
    setNameInput('');
    setError('');
  };

  const removeParticipant = (name: string) => {
    setParticipants((prev) => prev.filter((p) => p !== name));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addParticipant();
    }
  };

  // ── Create outing ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setError('');

    if (!outingName.trim()) {
      setError('Please enter an outing name');
      return;
    }
    if (participants.length < 2) {
      setError('Add at least 2 participants');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: outingName.trim(),
          participants,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }

      // Persist active trip to localStorage for session retention (Phase 5)
      localStorage.setItem('splitday_active_trip', data.trip._id);

      router.push(`/trip/${data.trip._id}`);
    } catch {
      setError('Network error – please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-10"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%)' }}>

      <div className="max-w-md w-full mx-auto animate-fade-in-up space-y-6">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 pulse-glow"
               style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
            {/* Split icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
              <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 14H11v-5H8l4-4 4 4h-3Z"/>
            </svg>
          </div>
          <h1 className="text-5xl font-extrabold gradient-text tracking-tight mb-2">SplitDay</h1>
          <p className="text-gray-400 text-base">Track group expenses — no sign-up needed.</p>
        </div>

        {/* ── Session Resume Banner (Phase 5) ──────────────────────────────── */}
        {savedTripId && (
          <div className="animate-fade-in-up rounded-2xl p-4 flex items-center justify-between gap-3"
               style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <div>
              <p className="text-violet-300 text-sm font-semibold">Resume where you left off?</p>
              <p className="text-gray-500 text-xs mt-0.5">You have an active outing session.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                id="resume-trip-btn"
                onClick={() => router.push(`/trip/${savedTripId}`)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
              >
                Resume
              </button>
              <button
                id="dismiss-resume-btn"
                onClick={() => { localStorage.removeItem('splitday_active_trip'); setSavedTripId(null); }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ── Form Card ────────────────────────────────────────────────────── */}
        <div className="glass-card p-6 space-y-5">

          {/* Outing Name */}
          <div className="space-y-1.5">
            <label htmlFor="outing-name" className="text-sm font-medium text-gray-300">
              Outing Name
            </label>
            <input
              id="outing-name"
              type="text"
              className="input-field"
              placeholder="e.g. Galle Road Trip 🏖️"
              value={outingName}
              onChange={(e) => setOutingName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              maxLength={60}
            />
          </div>

          {/* Participants */}
          <div className="space-y-1.5">
            <label htmlFor="participant-input" className="text-sm font-medium text-gray-300">
              Add Friends
            </label>
            <div className="flex gap-2">
              <input
                id="participant-input"
                type="text"
                className="input-field flex-1"
                placeholder="Type a name, press Enter"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={30}
              />
              <button
                onClick={addParticipant}
                id="add-participant-btn"
                className="btn-brand px-4 shrink-0"
                aria-label="Add participant"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
              </button>
            </div>

            {/* Participant chips */}
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {participants.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-violet-300 border border-violet-700/50 animate-fade-in-up"
                    style={{ background: 'rgba(124,58,237,0.15)' }}
                  >
                    {name}
                    <button
                      onClick={() => removeParticipant(name)}
                      aria-label={`Remove ${name}`}
                      className="ml-0.5 hover:text-rose-400 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-rose-400 text-sm font-medium animate-fade-in-up"
               role="alert">
              ⚠ {error}
            </p>
          )}

          {/* Create button */}
          <button
            id="create-outing-btn"
            onClick={handleCreate}
            disabled={isLoading}
            className="btn-brand w-full text-base py-3"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Creating…
              </>
            ) : (
              <>
                🚀 Create Outing
              </>
            )}
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-center text-gray-600 text-xs">
          No account needed · Share the invite code with your group
        </p>
      </div>
    </main>
  );
}
