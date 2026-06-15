import { Types } from 'mongoose';

// ─── Trip ────────────────────────────────────────────────────────────────────

export interface TripData {
  _id: string;
  userId: string;
  userIds?: string[];
  name: string;
  inviteCode: string;
  participants: string[];
  createdAt: string;
}

// ─── Expense ─────────────────────────────────────────────────────────────────

export interface ExpenseData {
  _id: string;
  tripId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  isUnequal: boolean;
  customShares?: Record<string, number>;
  category?: string;
  createdAt: string;
}

export interface NewExpensePayload {
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  isUnequal?: boolean;
  customShares?: Record<string, number>;
  category?: string;
}

// ─── Settlements ─────────────────────────────────────────────────────────────

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface TripResponse {
  trip: TripData;
  expenses: ExpenseData[];
  settlements: Settlement[];
  totalSpent: number;
}

export interface ApiError {
  error: string;
}
