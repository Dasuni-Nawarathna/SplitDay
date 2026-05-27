import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Expense from '@/models/Expense';

type Params = { params: Promise<{ id: string; expId: string }> };

// ── DELETE /api/trips/[id]/expenses/[expId] ──────────────────────────────────
// Deletes a single expense by ID, validates it belongs to the trip.
export async function DELETE(
  _req: NextRequest,
  { params }: Params
) {
  try {
    await connectToDatabase();
    const { id, expId } = await params;

    const expense = await Expense.findOneAndDelete({
      _id: expId,
      tripId: id,
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found or does not belong to this trip' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error('[DELETE /api/trips/[id]/expenses/[expId]]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
