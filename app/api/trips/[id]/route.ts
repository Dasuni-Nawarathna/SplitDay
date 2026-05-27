import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Trip from '@/models/Trip';
import Expense from '@/models/Expense';
import { calculateSettlements } from '@/utils/calculateSettlements';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/trips/[id] ──────────────────────────────────────────────────────
// Returns: { trip, expenses, settlements, totalSpent }
// Phase 3: settlements are automatically computed here.
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();

    const { id } = await params;

    const trip = await Trip.findById(id).lean();
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const expenses = await Expense.find({ tripId: id })
      .sort({ createdAt: -1 })
      .lean();

    // Normalise Mongoose docs → plain objects (convert Map → plain object)
    const normalisedExpenses = expenses.map((exp) => ({
      ...exp,
      _id: exp._id.toString(),
      tripId: exp.tripId.toString(),
      customShares: exp.customShares
        ? Object.fromEntries(exp.customShares as unknown as Map<string, number>)
        : undefined,
    }));

    // ── Phase 3: Calculate settlements ──────────────────────────────────────
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    const settlements = calculateSettlements(
      trip.participants as string[],
      normalisedExpenses.map((e) => ({
        amount: e.amount,
        paidBy: e.paidBy,
        splitBetween: e.splitBetween,
        isUnequal: e.isUnequal,
        customShares: e.customShares,
      }))
    );

    return NextResponse.json(
      {
        trip: { ...trip, _id: trip._id.toString() },
        expenses: normalisedExpenses,
        settlements,
        totalSpent: Math.round(totalSpent * 100) / 100,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('[GET /api/trips/[id]]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
