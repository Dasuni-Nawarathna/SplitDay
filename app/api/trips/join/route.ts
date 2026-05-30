import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Trip from '@/models/Trip';
import { getAuthUser } from '@/lib/auth';
import { Types } from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const body = await req.json();
    const { inviteCode } = body as { inviteCode?: string };

    if (!inviteCode || typeof inviteCode !== 'string' || inviteCode.trim() === '') {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const code = inviteCode.trim().toUpperCase();

    const trip = await Trip.findOne({ inviteCode: code });
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found with this invite code' }, { status: 404 });
    }

    const userObjectId = new Types.ObjectId(user.userId);

    // Initialize userIds if it doesn't exist
    if (!trip.userIds) {
      trip.userIds = [trip.userId];
    }

    // Add user to userIds if they aren't already in it
    const isAlreadyMember = trip.userIds.some((id) => id.toString() === user.userId) || 
                            trip.userId.toString() === user.userId;

    if (!isAlreadyMember) {
      trip.userIds.push(userObjectId);
      await trip.save();
    }

    return NextResponse.json({ success: true, tripId: trip._id.toString() });
  } catch (err) {
    console.error('[POST /api/trips/join]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
