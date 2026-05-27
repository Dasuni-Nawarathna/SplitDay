import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Trip from '@/models/Trip';
import Expense from '@/models/Expense';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/trips/[id]/expenses ─────────────────────────────────────────────
// Returns: { expenses: ExpenseData[] }
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

    const normalisedExpenses = expenses.map((exp) => ({
      ...exp,
      _id: exp._id.toString(),
      tripId: exp.tripId.toString(),
      customShares: exp.customShares
        ? (exp.customShares instanceof Map
            ? Object.fromEntries(exp.customShares)
            : (exp.customShares as Record<string, number>))
        : undefined,
    }));

    return NextResponse.json({ expenses: normalisedExpenses }, { status: 200 });
  } catch (err: unknown) {
    console.error('[GET /api/trips/[id]/expenses]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── POST /api/trips/[id]/expenses ────────────────────────────────────────────
// Body: { description, amount, paidBy, splitBetween, isUnequal?, customShares? }
// Returns: { expense: ExpenseData }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const trip = await Trip.findById(id).lean();
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      description,
      amount,
      paidBy,
      splitBetween,
      isUnequal = false,
      customShares,
    } = body as {
      description?: string;
      amount?: number;
      paidBy?: string;
      splitBetween?: string[];
      isUnequal?: boolean;
      customShares?: Record<string, number>;
    };

    // ── Validate required fields ──────────────────────────────────────────
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const participants = trip.participants as string[];

    if (!paidBy || !participants.includes(paidBy)) {
      return NextResponse.json(
        { error: `paidBy must be one of: ${participants.join(', ')}` },
        { status: 400 }
      );
    }

    if (
      !splitBetween ||
      !Array.isArray(splitBetween) ||
      splitBetween.length === 0
    ) {
      return NextResponse.json(
        { error: 'splitBetween must include at least one participant' },
        { status: 400 }
      );
    }

    // Validate all splitBetween names exist in the trip
    const invalidNames = splitBetween.filter((n) => !participants.includes(n));
    if (invalidNames.length > 0) {
      return NextResponse.json(
        {
          error: `Unknown participants in splitBetween: ${invalidNames.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // If isUnequal, validate customShares sums approximately to amount
    if (isUnequal && customShares) {
      const total = Object.values(customShares).reduce(
        (s, v) => s + (v ?? 0),
        0
      );
      if (Math.abs(total - amount) > 0.02) {
        return NextResponse.json(
          {
            error: `Custom shares total (${total.toFixed(2)}) must equal amount (${amount.toFixed(2)})`,
          },
          { status: 400 }
        );
      }
    }

    const expense = await Expense.create({
      tripId: id,
      description: description.trim(),
      amount,
      paidBy,
      splitBetween,
      isUnequal,
      customShares: customShares ?? undefined,
      createdAt: new Date(),
    });

    const expObj = expense.toObject();
    return NextResponse.json(
      {
        expense: {
          ...expObj,
          _id: expObj._id.toString(),
          tripId: expObj.tripId.toString(),
          customShares: expObj.customShares
            ? (expObj.customShares instanceof Map
                ? Object.fromEntries(expObj.customShares)
                : (expObj.customShares as Record<string, number>))
            : undefined,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[POST /api/trips/[id]/expenses]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
