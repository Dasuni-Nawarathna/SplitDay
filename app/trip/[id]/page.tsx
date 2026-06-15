'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { TripResponse, ExpenseData } from '@/types';
import { useAuth } from '@/lib/auth-context';

interface CommentData {
  _id: string;
  tripId: string;
  userId: string;
  userName: string;
  userProfilePicture?: string;
  text: string;
  createdAt: string;
}

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
  isOwner,
}: {
  expense: ExpenseData;
  onDelete: (id: string) => void;
  isOwner: boolean;
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
          {' · '}
          {expense.isUnequal ? (
            <span className="inline-flex items-center gap-0.5 text-amber-400 font-medium">
              ✏ Custom split
            </span>
          ) : (
            <>split with {expense.splitBetween.length === 1
              ? expense.splitBetween[0]
              : `${expense.splitBetween.length} people`}</>
          )}
        </p>
      </div>

      {/* Amount + delete */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-white font-bold">{fmt(expense.amount)}</span>
        {isOwner && (
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
        )}
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

type SplitMode = 'equal' | 'custom' | 'amount';
// 'one-paid' = one person fronted the whole bill, others owe their % or amount
// 'pooled'   = everyone paid their own portion directly (no one owes anyone)
type CustomType = 'one-paid' | 'pooled';

function AddExpenseModal({ participants, tripId, onClose, onAdded }: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [paidBy, setPaidBy] = useState(participants[0] ?? '');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [customType, setCustomType] = useState<CustomType>('one-paid');

  // Equal mode: checkbox selection
  const [splitBetween, setSplitBetween] = useState<string[]>(participants);

  // Custom % mode: percentage per person
  const [percentages, setPercentages] = useState<Record<string, string>>(() => {
    const even = participants.length > 0 ? Math.floor(100 / participants.length) : 0;
    const init: Record<string, string> = {};
    participants.forEach((p, i) => {
      init[p] = i === participants.length - 1
        ? String(100 - even * (participants.length - 1))
        : String(even);
    });
    return init;
  });

  // Custom Amount mode: exact amount per person
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    participants.forEach((p) => {
      init[p] = '';
    });
    return init;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalAllocatedAmount = participants.reduce(
    (sum, p) => sum + (parseFloat(customAmounts[p] ?? '0') || 0), 0
  );

  const amt = splitMode === 'amount' && customType === 'pooled' ? totalAllocatedAmount : (parseFloat(amount) || 0);

  const totalPct = participants.reduce(
    (sum, p) => sum + (parseFloat(percentages[p] ?? '0') || 0), 0
  );
  const pctRemaining = Math.round((100 - totalPct) * 10) / 10;

  const amtRemaining = Math.round((amt - totalAllocatedAmount) * 100) / 100;

  const isBalanced = splitMode === 'equal'
    ? true
    : splitMode === 'custom'
      ? Math.abs(totalPct - 100) < 0.01
      : customType === 'pooled'
        ? totalAllocatedAmount > 0
        : Math.abs(totalAllocatedAmount - amt) < 0.01;

  const getShares = (): Record<string, number> => {
    const shares: Record<string, number> = {};
    if (splitMode === 'custom') {
      participants.forEach((p) => {
        const pct = parseFloat(percentages[p] ?? '0') || 0;
        if (pct > 0) shares[p] = Math.round((amt * pct / 100) * 100) / 100;
      });
    } else if (splitMode === 'amount') {
      participants.forEach((p) => {
        const val = parseFloat(customAmounts[p] ?? '0') || 0;
        if (val > 0) shares[p] = Math.round(val * 100) / 100;
      });
    }
    return shares;
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleSplit = (name: string) =>
    setSplitBetween((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );

  const updatePct = (name: string, val: string) =>
    setPercentages((prev) => ({ ...prev, [name]: val }));

  const updateAmount = (name: string, val: string) =>
    setCustomAmounts((prev) => ({ ...prev, [name]: val }));

  const autoBalance = () => {
    if (splitMode === 'custom') {
      const n = participants.length;
      if (n === 0) return;
      const each = Math.floor(100 / n);
      const next: Record<string, string> = {};
      participants.forEach((p, i) => {
        next[p] = String(i === n - 1 ? each + (100 - each * n) : each);
      });
      setPercentages(next);
    } else if (splitMode === 'amount') {
      const n = participants.length;
      if (n === 0 || amt <= 0) return;
      const each = Math.floor((amt / n) * 100) / 100;
      const next: Record<string, string> = {};
      participants.forEach((p, i) => {
        next[p] = i === n - 1
          ? (amt - each * (n - 1)).toFixed(2)
          : each.toFixed(2);
      });
      setCustomAmounts(next);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');
    if (!description.trim()) return setError('Description is required');
    if (amt <= 0) return setError('Enter a valid amount');

    setIsLoading(true);
    try {
      if (splitMode === 'equal') {
        // One expense, equal split among selected people
        if (splitBetween.length === 0) {
          setError('Select at least one person'); setIsLoading(false); return;
        }
        const res = await fetch(`/api/trips/${tripId}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: description.trim(), amount: amt, paidBy, splitBetween, isUnequal: false, category }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'Failed to add expense'); setIsLoading(false); return; }

      } else if (customType === 'one-paid') {
        // One person fronted the full bill; others owe their custom % or amount
        if (!isBalanced) {
          if (splitMode === 'custom') {
            setError(`Percentages must total 100% (currently ${totalPct.toFixed(1)}%)`);
          } else {
            setError(`Allocated amounts ($${totalAllocatedAmount.toFixed(2)}) must equal total amount ($${amt.toFixed(2)})`);
          }
          setIsLoading(false); return;
        }
        const shares = getShares();
        if (Object.keys(shares).length === 0) {
          setError('At least one person needs a share > 0'); setIsLoading(false); return;
        }
        const res = await fetch(`/api/trips/${tripId}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: description.trim(), amount: amt, paidBy,
            splitBetween: Object.keys(shares), isUnequal: true, customShares: shares, category
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'Failed to add expense'); setIsLoading(false); return; }

      } else {
        // Pooled: each person paid their own portion → submit one expense per person
        if (!isBalanced) {
          if (splitMode === 'custom') {
            setError(`Percentages must total 100% (currently ${totalPct.toFixed(1)}%)`);
          } else {
            setError('Enter at least one amount > 0');
          }
          setIsLoading(false); return;
        }
        const shares = getShares();
        const contributors = Object.entries(shares).filter(([, v]) => v > 0);
        if (contributors.length === 0) {
          setError('At least one person needs a share > 0'); setIsLoading(false); return;
        }
        const results = await Promise.all(
          contributors.map(([name, shareAmt]) =>
            fetch(`/api/trips/${tripId}/expenses`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                description: `${description.trim()} (${name}'s share)`,
                amount: shareAmt,
                paidBy: name,
                splitBetween: [name],
                isUnequal: false,
                category
              }),
            })
          )
        );
        if (results.some((r) => !r.ok)) {
          setError('Failed to save one or more contributions'); setIsLoading(false); return;
        }
      }

      onAdded();
    } catch {
      setError('Network error – please try again');
    } finally {
      setIsLoading(false);
    }
  };

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const barColour = splitMode === 'custom'
    ? (isBalanced ? '#10b981' : totalPct > 100 ? '#f43f5e' : '#f59e0b')
    : (isBalanced ? '#10b981' : totalAllocatedAmount > amt ? '#f43f5e' : '#f59e0b');

  const barWidth = splitMode === 'custom'
    ? Math.min(totalPct, 100)
    : amt > 0 ? Math.min((totalAllocatedAmount / amt) * 100, 100) : 0;

  const showPaidBy = splitMode === 'equal' || customType === 'one-paid';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-card w-full max-w-md animate-fade-in-up overflow-y-auto"
        style={{ borderRadius: '1.5rem', maxHeight: '90dvh', padding: '1.5rem' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Log Expense</h2>
          <button onClick={onClose} aria-label="Close modal" id="close-modal-btn"
                  className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Description</label>
            <input id="expense-description" type="text" className="input-field"
                   placeholder="e.g. Dinner at Ministry of Crab"
                   value={description} onChange={(e) => setDescription(e.target.value)} maxLength={80} />
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400">
              {splitMode === 'amount' && customType === 'pooled' ? 'Total Amount ($) — Auto-calculated' : 'Total Amount ($)'}
            </label>
            <input id="expense-amount" type="number" className="input-field"
                   placeholder="0.00" min="0.01" step="0.01"
                   disabled={splitMode === 'amount' && customType === 'pooled'}
                   value={splitMode === 'amount' && customType === 'pooled' ? totalAllocatedAmount.toFixed(2) : amount}
                   onChange={(e) => setAmount(e.target.value)} />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Category</label>
            <select id="expense-category" className="input-field"
                    value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Activities">Activities</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Paid By — hidden when everyone chips in their own */}
          {showPaidBy && (
            <div className="space-y-1 animate-fade-in-up">
              <label className="text-sm text-gray-400">
                {splitMode !== 'equal' ? 'Who fronted the full amount?' : 'Paid By'}
              </label>
              <select id="expense-paid-by" className="input-field"
                      value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                {participants.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── Split Mode Toggle ──────────────────────────────────────── */}
          <div className="space-y-3">
            <label className="text-sm text-gray-400">How to Split?</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'equal' as SplitMode, label: '⚖ Equal' },
                { key: 'custom' as SplitMode, label: '✏ Custom %' },
                { key: 'amount' as SplitMode, label: '💵 Custom $' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  id={`split-mode-${key}`}
                  onClick={() => setSplitMode(key)}
                  className="py-2.5 px-1 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: splitMode === key ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${splitMode === key ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`,
                    color: splitMode === key ? '#fff' : '#9ca3af',
                    boxShadow: splitMode === key ? '0 4px 14px rgba(124,58,237,0.3)' : 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── Equal: checkboxes ────────────────────────────────────── */}
            {splitMode === 'equal' && (
              <div className="grid grid-cols-2 gap-2">
                {participants.map((p) => {
                  const checked = splitBetween.includes(p);
                  const share = checked && amt > 0 ? amt / splitBetween.length : null;
                  return (
                    <button key={p} id={`split-toggle-${p}`} onClick={() => toggleSplit(p)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                            style={{
                              border: `1px solid ${checked ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`,
                              background: checked ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
                            }}>
                      <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${checked ? 'bg-violet-600' : 'bg-white/10'}`}>
                        {checked && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="white" className="w-3 h-3">
                            <path fillRule="evenodd" d="M9.854 2.646a.5.5 0 0 1 0 .708L5 8.207 2.146 5.354a.5.5 0 1 1 .708-.708L5 6.793l4.146-4.147a.5.5 0 0 1 .708 0Z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block truncate ${checked ? 'text-violet-200' : 'text-gray-500'}`}>{p}</span>
                        {share !== null && <span className="block text-xs text-violet-400">${share.toFixed(2)}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Custom % or Custom Amount: sub-type + rows ──────────────── */}
            {splitMode !== 'equal' && (
              <div className="space-y-3">

                {/* Who-paid sub-toggle */}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: 'one-paid' as CustomType, label: '👤 One person paid', hint: splitMode === 'custom' ? 'Others owe their %' : 'Others owe their $' },
                    { key: 'pooled'   as CustomType, label: '🤝 Everyone chipped in', hint: 'Each paid their own' },
                  ]).map(({ key, label, hint }) => (
                    <button
                      key={key}
                      id={`custom-type-${key}`}
                      onClick={() => setCustomType(key)}
                      className="flex flex-col items-start px-3 py-2.5 rounded-xl text-left transition-all"
                      style={{
                        border: `1px solid ${customType === key ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`,
                        background: customType === key ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <span className={`text-xs font-semibold ${customType === key ? 'text-amber-400' : 'text-gray-500'}`}>{label}</span>
                      <span className="text-gray-600 text-xs mt-0.5">{hint}</span>
                    </button>
                  ))}
                </div>

                {/* Info banner for pooled mode */}
                {customType === 'pooled' && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-xl animate-fade-in-up"
                       style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <span className="text-emerald-400 text-sm mt-0.5">✓</span>
                    <p className="text-emerald-300 text-xs leading-relaxed">
                      Each person&apos;s {splitMode === 'custom' ? 'percentage' : 'amount'} is what <strong>they already paid</strong>. No one owes anyone — automatically settled!
                    </p>
                  </div>
                )}

                {/* Progress bar */}
                {!(splitMode === 'amount' && customType === 'pooled') && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Total allocated</span>
                      {splitMode === 'custom' ? (
                        <span style={{ color: barColour }} className="font-bold">
                          {totalPct.toFixed(1)}%
                          {!isBalanced && pctRemaining !== 0 && (
                            <span className="text-gray-500 font-normal ml-1">
                              ({pctRemaining > 0 ? `+${pctRemaining}` : pctRemaining}% remaining)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: barColour }} className="font-bold">
                          ${totalAllocatedAmount.toFixed(2)} / ${amt.toFixed(2)}
                          {!isBalanced && amtRemaining !== 0 && (
                            <span className="text-gray-500 font-normal ml-1">
                              ({amtRemaining > 0 ? `+$${amtRemaining.toFixed(2)}` : `-$${Math.abs(amtRemaining).toFixed(2)}`} remaining)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all duration-300"
                           style={{ width: `${barWidth}%`, background: barColour }} />
                    </div>
                  </div>
                )}

                {/* Per-person rows */}
                {participants.map((p) => {
                  const pct = parseFloat(percentages[p] ?? '0') || 0;
                  const personAmt = splitMode === 'custom'
                    ? (amt > 0 ? amt * pct / 100 : 0)
                    : (parseFloat(customAmounts[p] ?? '0') || 0);

                  return (
                    <div key={p} className="flex items-center gap-3 p-3 rounded-xl"
                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                           style={{ background: avatarColour(p) }}>
                        {p[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{p}</p>
                        {personAmt > 0 && (
                          <p className="text-xs mt-0.5" style={{ color: customType === 'pooled' ? '#10b981' : '#a78bfa' }}>
                            {customType === 'pooled' ? '✓ paid' : 'owes'} ${personAmt.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {splitMode === 'custom' ? (
                          <>
                            <input
                              id={`pct-input-${p}`}
                              type="number" min="0" max="100" step="1"
                              value={percentages[p] ?? ''}
                              onChange={(e) => updatePct(p, e.target.value)}
                              className="w-16 text-right text-sm font-bold text-white rounded-lg px-2 py-1.5 outline-none"
                              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
                              placeholder="0"
                            />
                            <span className="text-gray-400 text-sm">%</span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-400 text-sm">$</span>
                            <input
                              id={`amt-input-${p}`}
                              type="number" min="0" step="0.01"
                              value={customAmounts[p] ?? ''}
                              onChange={(e) => updateAmount(p, e.target.value)}
                              className="w-20 text-right text-sm font-bold text-white rounded-lg px-2 py-1.5 outline-none"
                              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
                              placeholder="0.00"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
          {/* Auto-balance */}
                <button id="auto-balance-btn" onClick={autoBalance}
                        className="w-full py-2 rounded-xl text-xs font-semibold text-violet-400 hover:text-violet-300 transition-all"
                        style={{ background: 'rgba(124,58,237,0.08)', border: '1px dashed rgba(124,58,237,0.3)' }}>
                  ↺ Split Evenly (auto-balance)
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && <p className="text-rose-400 text-sm animate-fade-in-up" role="alert">⚠ {error}</p>}

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
            ) : splitMode !== 'equal' && customType === 'pooled'
                ? `✓ Log ${Object.values(getShares()).filter(v => v > 0).length} Contributions`
                : '✓ Add Expense'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function TripDashboard() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [data, setData] = useState<TripResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Comments state
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Phase 5: Persist session in localStorage
  useEffect(() => {
    if (tripId) localStorage.setItem('splitday_active_trip', tripId);
  }, [tripId]);

  const fetchTrip = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      if (!res.ok) {
        setError(res.status === 404 ? 'Trip not found. The link may be invalid.' : 'Failed to load trip data');
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

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/comments`);
      if (res.ok) {
        const json = await res.json();
        setComments(json.comments || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTrip();
    fetchComments();
  }, [fetchTrip, fetchComments]);

  const handleExpenseAdded = () => {
    setShowModal(false);
    setIsLoading(true);
    fetchTrip();
  };

  const handleDeleteExpense = async (expId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, expenses: prev.expenses.filter((e) => e._id !== expId) };
    });
    await fetch(`/api/trips/${tripId}/expenses/${expId}`, { method: 'DELETE' });
    fetchTrip();
  };

  const copyCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.trip.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || postingComment) return;

    setPostingComment(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment.trim() }),
      });
      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setPostingComment(false);
    }
  };

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
          <button onClick={() => router.push('/')} className="btn-brand">← Back Home</button>
        </div>
      </main>
    );
  }

  const { trip, expenses, settlements, totalSpent } = data;
  const perPersonAvg = trip.participants.length > 0 ? totalSpent / trip.participants.length : 0;
  const isOwner = user?.userId === trip.userId;

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
                className="text-xs font-mono text-brand-light hover:text-brand-primary transition-colors flex items-center gap-1"
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
            { label: 'Per Person', value: fmt(perPersonAvg), color: 'text-brand-light' },
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

        {/* ── Settlements ────────────────────────────────────────────────── */}
        <div className="glass-card p-5">
          <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <span className="text-violet-400">⚖</span> Who Owes Who
          </h2>
          {settlements.length === 0 ? (
            <p className="text-gray-500 text-sm py-2">
              {expenses.length === 0 ? 'Add expenses to see settlements.' : '🎉 All settled up!'}
            </p>
          ) : (
            <div>
              {settlements.map((s, i) => (
                <SettlementRow key={i} from={s.from} to={s.to} amount={s.amount} />
              ))}
            </div>
          )}
        </div>

        {/* ── Expense Log ────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-amber-400">🧾</span> Expense Log
          </h2>
          {expenses.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <p className="text-gray-500 text-sm">No expenses yet.</p>
              {isOwner && <p className="text-gray-600 text-xs mt-1">Tap the + button to log one.</p>}
            </div>
          ) : (
            expenses.map((exp) => (
              <ExpenseCard key={exp._id} expense={exp} onDelete={handleDeleteExpense} isOwner={isOwner} />
            ))
          )}
        </div>

        {/* ── Comments Section ───────────────────────────────────────────── */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <span className="text-violet-400">💬</span> Chat & Comments
          </h2>

          {/* Comments List */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-xs py-4 text-center">No comments yet. Start the conversation!</p>
            ) : (
              comments.map((c) => (
                <div key={c._id} className="flex gap-3 text-sm animate-fade-in-up">
                  {/* User Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-violet-500/20 bg-violet-600/30">
                    {c.userProfilePicture ? (
                      <img src={c.userProfilePicture} alt={c.userName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xs">{c.userName[0].toUpperCase()}</span>
                    )}
                  </div>
                  {/* Content Bubble */}
                  <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-3.5 py-2 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-violet-300 text-xs truncate">{c.userName}</span>
                      <span className="text-[10px] text-gray-500 shrink-0">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-gray-200 text-xs mt-1 whitespace-pre-wrap break-words">{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Input */}
          {user && (trip.userId === user.userId || (trip.userIds && trip.userIds.some((uid: string) => uid === user.userId))) ? (
            <form onSubmit={handlePostComment} className="flex gap-2 pt-2 border-t border-white/5">
              <input
                type="text"
                className="input-field py-2 text-xs flex-1"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={400}
              />
              <button
                type="submit"
                disabled={postingComment || !newComment.trim()}
                className="btn-brand px-4 py-2 text-xs font-semibold shrink-0"
              >
                Send
              </button>
            </form>
          ) : (
            <p className="text-[10px] text-gray-500 text-center pt-2 border-t border-white/5">
              Only joined group members can comment.
            </p>
          )}
        </div>
      </div>

      {/* ── Floating Add Button ────────────────────────────────────────────── */}
      {isOwner && (
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
      )}

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
