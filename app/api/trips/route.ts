import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Trip from '@/models/Trip';

// ── POST /api/trips ──────────────────────────────────────────────────────────
// Body: { name: string; participants: string[] }
// Returns: { trip: TripData }
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { name, participants } = body as {
      name?: string;
      participants?: string[];
    };

    // Validate
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Trip name is required' },
        { status: 400 }
      );
    }

    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length < 1
    ) {
      return NextResponse.json(
        { error: 'At least one participant is required' },
        { status: 400 }
      );
    }

    // Sanitise participant names
    const cleanParticipants = participants
      .map((p) => String(p).trim())
      .filter((p) => p.length > 0);

    if (cleanParticipants.length === 0) {
      return NextResponse.json(
        { error: 'Participant names cannot be empty' },
        { status: 400 }
      );
    }

    // Guarantee invite code uniqueness with a simple retry loop
    let trip;
    let attempts = 0;
    while (!trip && attempts < 5) {
      attempts++;
      const rand = Math.floor(1000 + Math.random() * 9000);
      const inviteCode = `TRIP-${rand}`;

      const existing = await Trip.findOne({ inviteCode });
      if (existing) continue;

      trip = await Trip.create({
        name: name.trim(),
        inviteCode,
        participants: cleanParticipants,
        createdAt: new Date(),
      });
    }

    if (!trip) {
      return NextResponse.json(
        { error: 'Could not generate a unique invite code. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ trip }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/trips]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
