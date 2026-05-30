import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Trip from '@/models/Trip';
import { getAuthUser } from '@/lib/auth';

// ── GET /api/trips — list all trips for logged-in user ───────────────────────
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const trips = await Trip.find({
      $or: [
        { userId: user.userId },
        { userIds: user.userId },
      ],
    }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ trips });
  } catch (err) {
    console.error('[GET /api/trips]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/trips — create a new trip ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const body = await req.json();
    const { name, participants } = body as { name?: string; participants?: string[] };

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Trip name is required' }, { status: 400 });
    }
    if (!participants || !Array.isArray(participants) || participants.length < 1) {
      return NextResponse.json({ error: 'At least one participant is required' }, { status: 400 });
    }

    const cleanParticipants = participants.map((p) => String(p).trim()).filter((p) => p.length > 0);
    if (cleanParticipants.length === 0) {
      return NextResponse.json({ error: 'Participant names cannot be empty' }, { status: 400 });
    }

    // Unique invite code with retry
    let trip;
    let attempts = 0;
    while (!trip && attempts < 5) {
      attempts++;
      const rand = Math.floor(1000 + Math.random() * 9000);
      const inviteCode = `TRIP-${rand}`;
      const existing = await Trip.findOne({ inviteCode });
      if (existing) continue;
      trip = await Trip.create({
        userId: user.userId,
        userIds: [user.userId],
        name: name.trim(),
        inviteCode,
        participants: cleanParticipants,
        createdAt: new Date(),
      });
    }

    if (!trip) {
      return NextResponse.json({ error: 'Could not generate invite code. Try again.' }, { status: 500 });
    }

    return NextResponse.json({ trip }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/trips]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
