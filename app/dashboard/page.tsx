'use client';

import { useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';

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
  const { user, isLoading: authLoading, logout, refresh } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [formMode, setFormMode] = useState<'create' | 'join' | null>(null);

  // Create Form state
  const [outingName, setOutingName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  // Join Form state
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Profile Modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profilePic, setProfilePic] = useState(user?.profilePicture ?? '');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync state with user context updates
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePic(user.profilePicture || '');
    }
  }, [user]);

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

  const handleJoin = async () => {
    setFormError('');
    if (!inviteCode.trim()) { setFormError('Enter an invite code'); return; }

    setJoining(true);
    try {
      const res = await fetch('/api/trips/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? 'Failed to join outing'); return; }
      router.push(`/trip/${data.tripId}`);
    } catch {
      setFormError('Network error – please try again');
    } finally {
      setJoining(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setProfileError('Image must be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePic(reader.result as string);
      setProfileError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setProfileError('');
    if (!profileName.trim()) {
      setProfileError('Name is required');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName.trim(), profilePicture: profilePic }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error ?? 'Failed to update profile');
        return;
      }
      await refresh();
      setShowProfileModal(false);
    } catch {
      setProfileError('Network error – please try again');
    } finally {
      setSavingProfile(false);
    }
  };

  const resetForm = () => {
    setFormMode(null);
    setOutingName('');
    setNameInput('');
    setParticipants([]);
    setInviteCode('');
    setFormError('');
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main
      className="min-h-dvh pb-10"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--color-brand-primary-val) 12%, transparent) 0%, transparent 65%)' }}
    >
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar image/button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-brand-primary/30 hover:border-brand-light transition-colors"
              title="Edit Profile"
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, var(--color-brand-primary-val), var(--gradient-stop-3))' }}
                >
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
            </button>
            <div>
              <h1 className="text-xl font-extrabold gradient-text leading-tight">SplitDay</h1>
              <p
                onClick={() => setShowProfileModal(true)}
                className="text-gray-400 text-xs mt-0.5 hover:text-brand-light cursor-pointer transition-colors"
              >
                Hey, <span className="text-brand-light font-medium">{user?.name}</span> 👋
              </p>
            </div>
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

        {/* ── Action Box ─────────────────────────────────────────────────── */}
        {formMode === 'create' && (
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
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm text-brand-light"
                      style={{ background: 'color-mix(in srgb, var(--color-brand-primary-val) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--color-brand-primary-val) 30%, transparent)' }}
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
                  <svg className="animate-spin w-4 h-4 mr-2 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating…
                </>
              ) : '🚀 Start Outing'}
            </button>
          </div>
        )}

        {formMode === 'join' && (
          <div className="glass-card p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Join Outing</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">Invite Code</label>
              <input
                id="invite-code-input"
                type="text"
                className="input-field uppercase"
                placeholder="e.g. TRIP-1234"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                maxLength={20}
              />
            </div>

            {formError && <p className="text-rose-400 text-sm animate-fade-in-up">⚠ {formError}</p>}

            <button
              id="join-outing-btn"
              onClick={handleJoin}
              disabled={joining}
              className="btn-brand w-full py-3"
            >
              {joining ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Joining…
                </>
              ) : '🔑 Join Outing'}
            </button>
          </div>
        )}

        {formMode === null && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
            <button
              id="new-outing-btn"
              onClick={() => setFormMode('create')}
              className="btn-brand py-3 text-sm font-semibold"
            >
              🚀 Start Outing
            </button>
            <button
              id="join-outing-mode-btn"
              onClick={() => setFormMode('join')}
              className="py-3 px-4 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              🔑 Join Outing
            </button>
          </div>
        )}

        {/* ── My Outings ──────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            My Outings
          </h2>

          {tripsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
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
                      <span className="font-mono text-brand-light">{trip.inviteCode}</span>
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

      {/* ── Edit Profile Modal ───────────────────────────────────────────── */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowProfileModal(false); }}
        >
          <div
            className="glass-card w-full max-w-sm animate-fade-in-up p-6 space-y-5"
            style={{ borderRadius: '1.5rem' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Edit Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {/* Profile Pic Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-violet-500/40">
                {profilePic ? (
                  <img src={profilePic} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-extrabold text-3xl"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
                  >
                    {profileName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                {/* Upload Overlay */}
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                  <span className="text-[10px] text-white font-medium mt-1">Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p className="text-[10px] text-gray-500">Supports JPG, PNG (Max 1MB)</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your Name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Theme Preference</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTheme('default')}
                    className={`py-2 rounded-xl text-xs font-semibold border ${theme === 'default' ? 'border-violet-500 bg-violet-500/20 text-white' : 'border-gray-700 bg-transparent text-gray-400 hover:border-gray-500'}`}
                  >
                    Default
                  </button>
                  <button
                    onClick={() => setTheme('ocean')}
                    className={`py-2 rounded-xl text-xs font-semibold border ${theme === 'ocean' ? 'border-sky-500 bg-sky-500/20 text-white' : 'border-gray-700 bg-transparent text-gray-400 hover:border-gray-500'}`}
                  >
                    Ocean
                  </button>
                  <button
                    onClick={() => setTheme('forest')}
                    className={`py-2 rounded-xl text-xs font-semibold border ${theme === 'forest' ? 'border-emerald-500 bg-emerald-500/20 text-white' : 'border-gray-700 bg-transparent text-gray-400 hover:border-gray-500'}`}
                  >
                    Forest
                  </button>
                </div>
              </div>

              {profileError && <p className="text-rose-400 text-xs animate-fade-in-up">⚠ {profileError}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 btn-brand py-2.5 text-xs font-semibold"
                >
                  {savingProfile ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
