'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { TripResponse, ExpenseData } from '@/types';

// ── Colour palette for participant avatars ────────────────────────────────────
const AVATAR_COLOURS = [
  '#7c3aed', '#db2777', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#7c3aed', '#9333ea',
];

function avatarColour(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length];
}

// ── Format currency ───────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

// ── Sub-components ────────────────────────────────────────────────────────────

function SettlementRow({ from, to, amount }: { from: string; to: string; amount: number }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 animate-fade-in-up">
      <span className="font-semibold text-rose-400 text-sm">{from}</span>
      <div className="flex-1 flex items-center gap-1 text-gray-500">
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, #f43f5e55, #7c3aed55)' }} />
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-violet-400 shrink-0">
          <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
        </svg>
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, #7c3aed55, #10b98155)' }} />
      </div>
      <span className="font-semibold text-emerald-400 text-sm">{to}</span>
      <span className="ml-1 font-bold text-white text-sm">{fmt(amount)}</span>
    </div>
  );
}

function ExpenseCard({
  expense,
  onDelete,
}: {
  expense: ExpenseData;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const colour = avatarColour(expense.paidBy);

  const handleDelete = async () => {
    if (!confirm(`Delete "${expense.description}"?`)) return;
    setDeleting(true);
    onDelete(expense._id);
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl mb-3 animate-fade-in-up"
         style={{ background: 'rgba(36,36,64,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
           style={{ background: colour }}>
        {expense.paidBy[0].toUpperCase()}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{expense.description}</p>
        <p className="text-gray-400 text-xs mt-0.5">
          Paid by <span className="text-violet-300 font-medium">{expense.paidBy}</span>
          {' · '}split with {expense.splitBetween.length === 1
            ? expense.splitBetween[0]
            : `${expense.splitBetween.length} people`}
        </p>
      </div>

      {/* Amount + delete */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-white font-bold">{fmt(expense.amount)}</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete expense"
          id={`delete-expense-${expense._id}`}
          className="text-gray-600 hover:text-rose-400 transition-colors disabled:opacity-40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Add Expense Modal ─────────────────────────────────────────────────────────

interface AddExpenseModalProps {
  participants: string[];
  tripId: string;
  onClose: () => void;
  onAdded: () => void;
}

function AddExpenseModal({ participants, tripId, onClose, onAdded }: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(participants[0] ?? '');
  const [splitBetween, setSplitBetween] = useState<string[]>(participants);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSplit = (name: string) => {
    setSplitBetween((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const handleSubmit = async () => {
    setError('');
    if (!description.trim()) return setError('Description is required');
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) return setError('Enter a valid amount');
    if (splitBetween.length === 0) return setError('Select at least one person to split with');

    setIsLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), amount: amt, paidBy, splitBetween }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? 'Failed to add expense');
      onAdded();
    } catch {
      setError('Network error – please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-card w-full max-w-md p-6 space-y-4 animate-fade-in-up"
           style={{ borderRadius: '1.5rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Log Expense</h2>
          <button onClick={onClose} aria-label="Close modal" id="close-modal-btn"
                  className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-sm text-gray-400">Description</label>
          <input id="expense-description" type="text" className="input-field"
                 placeholder="e.g. Dinner at Ministry of Crab"
                 value={description} onChange={(e) => setDescription(e.target.value)} maxLength={80} />
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <label className="text-sm text-gray-400">Amount ($)</label>
          <input id="expense-amount" type="number" className="input-field"
                 placeholder="0.00" min="0.01" step="0.01"
                 value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        {/* Paid By */}
        <div className="space-y-1">
          <label className="text-sm text-gray-400">Paid By</label>
          <select id="expense-paid-by" className="input-field"
                  value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {participants.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Split Between */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Split Between</label>
          <div className="grid grid-cols-2 gap-2">
            {participants.map((p) => {
              const checked = splitBetween.includes(p);
              return (
                <button
                  key={p}
                  id={`split-toggle-${p}`}
                  onClick={() => toggleSplit(p)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    checked
                      ? 'text-violet-300 border-violet-600'
                      : 'text-gray-500 border-white/10'
                  }`}
                  style={{
                    border: '1px solid',
                    background: checked ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <span className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                    checked ? 'bg-violet-600' : 'bg-white/10'
                  }`}>
                    {checked && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="white" className="w-3 h-3">
                        <path fillRule="evenodd" d="M9.854 2.646a.5.5 0 0 1 0 .708L5 8.207 2.146 5.354a.5.5 0 1 1 .708-.708L5 6.793l4.146-4.147a.5.5 0 0 1 .708 0Z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </span>
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-rose-400 text-sm" role="alert">⚠ {error}</p>
        )}

        {/* Submit */}
        <button id="add-expense-submit" onClick={handleSubmit} disabled={isLoading}
                className="btn-brand w-full py-3">
          {isLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Adding…
            </>
          ) : '✓ Add Expense'}
        </button>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function TripDashboard() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [data, setData] = useState<TripResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Phase 5: Persist session in localStorage
  useEffect(() => {
    if (tripId) localStorage.setItem('splitday_active_trip', tripId);
  }, [tripId]);

  const fetchTrip = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Trip not found. The link may be invalid.');
        } else {
          setError('Failed to load trip data');
        }
        return;
      }
      const json: TripResponse = await res.json();
      setData(json);
    } catch {
      setError('Network error – please refresh');
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const handleExpenseAdded = () => {
    setShowModal(false);
    setIsLoading(true);
    fetchTrip();
  };

  const handleDeleteExpense = async (expId: string) => {
    // Optimistic removal
    setData((prev) => {
      if (!prev) return prev;
      const updated = prev.expenses.filter((e) => e._id !== expId);
      return { ...prev, expenses: updated };
    });
    await fetch(`/api/trips/${tripId}/expenses/${expId}`, { method: 'DELETE' });
    fetchTrip(); // re-sync settlements
  };

  const copyCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.trip.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Loading trip…</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-4">
        <div className="glass-card p-6 text-center max-w-sm">
          <p className="text-rose-400 font-medium mb-4">{error || 'Unknown error'}</p>
          <button onClick={() => router.push('/')} className="btn-brand">
            ← Back Home
          </button>
        </div>
      </main>
    );
  }

  const { trip, expenses, settlements, totalSpent } = data;
  const perPersonAvg = trip.participants.length > 0
    ? totalSpent / trip.participants.length
    : 0;

  return (
    <main
      className="min-h-dvh pb-24"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 65%)' }}
    >
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} aria-label="Go home"
                  className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white leading-tight">{trip.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <button
                id="copy-invite-code-btn"
                onClick={copyCode}
                className="text-xs font-mono text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
              >
                {trip.inviteCode}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path d="M10.5 1.5A1.5 1.5 0 0 1 12 3v1h.5A1.5 1.5 0 0 1 14 5.5v7A1.5 1.5 0 0 1 12.5 14h-7A1.5 1.5 0 0 1 4 12.5V12H3.5A1.5 1.5 0 0 1 2 10.5v-7A1.5 1.5 0 0 1 3.5 2h7Zm0 1h-7A.5.5 0 0 0 3 3v7a.5.5 0 0 0 .5.5H4V5.5A1.5 1.5 0 0 1 5.5 4H11V3a.5.5 0 0 0-.5-.5Z"/>
                </svg>
              </button>
              {copied && <span className="text-xs text-emerald-400 animate-fade-in-up">Copied!</span>}
            </div>
          </div>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Spent', value: fmt(totalSpent), color: 'text-white' },
            { label: 'Per Person', value: fmt(perPersonAvg), color: 'text-violet-300' },
            { label: 'Expenses', value: String(expenses.length), color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card px-3 py-3 text-center">
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Participants Row ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {trip.participants.map((name) => (
            <div key={name}
                 className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-gray-300"
                 style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: avatarColour(name) }} />
              {name}
            </div>
          ))}
        </div>

        {/* ── Settlements Dashboard ──────────────────────────────────────── */}
        <div className="glass-card p-5">
          <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <span className="text-violet-400">⚖</span> Who Owes Who
          </h2>
          {settlements.length === 0 ? (
            <p className="text-gray-500 text-sm py-2">
              {expenses.length === 0
                ? 'Add expenses to see settlements.'
                : '🎉 All settled up!'}
            </p>
          ) : (
            <div>
              {settlements.map((s, i) => (
                <SettlementRow key={i} from={s.from} to={s.to} amount={s.amount} />
              ))}
            </div>
          )}
        </div>

        {/* ── Expense Log ───────────────────────────────────────────────── */}
        <div>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-amber-400">🧾</span> Expense Log
          </h2>
          {expenses.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <p className="text-gray-500 text-sm">No expenses yet.</p>
              <p className="text-gray-600 text-xs mt-1">Tap the + button to log one.</p>
            </div>
          ) : (
            expenses.map((exp) => (
              <ExpenseCard key={exp._id} expense={exp} onDelete={handleDeleteExpense} />
            ))
          )}
        </div>
      </div>

      {/* ── Floating Add Button ────────────────────────────────────────────── */}
      <button
        id="open-add-expense-modal-btn"
        onClick={() => setShowModal(true)}
        aria-label="Add expense"
        className="fixed bottom-6 right-1/2 translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-xl pulse-glow transition-transform hover:scale-110 active:scale-95 z-40"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-7 h-7">
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
      </button>

      {/* ── Add Expense Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <AddExpenseModal
          participants={trip.participants}
          tripId={tripId}
          onClose={() => setShowModal(false)}
          onAdded={handleExpenseAdded}
        />
      )}
    </main>
  );
}
