import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Trip from '@/models/Trip';
import Comment from '@/models/Comment';
import { getAuthUser } from '@/lib/auth';
import { User } from '@/models/User';
import { Types } from 'mongoose';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    const trip = await Trip.findById(id).lean();
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const comments = await Comment.find({ tripId: id })
      .sort({ createdAt: 1 }) // oldest first (chronological order)
      .lean();

    const normalisedComments = comments.map((c) => ({
      ...c,
      _id: c._id.toString(),
      tripId: c.tripId.toString(),
      userId: c.userId.toString(),
    }));

    return NextResponse.json({ comments: normalisedComments });
  } catch (err) {
    console.error('[GET /api/trips/[id]/comments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const trip = await Trip.findById(id).lean();
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Verify if user is part of the trip (owner or in userIds)
    const isMember = trip.userId.toString() === user.userId || 
                     (trip.userIds && trip.userIds.some((uid) => uid.toString() === user.userId));

    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden: You must be a member of this trip to post comments' }, { status: 403 });
    }

    const body = await req.json();
    const { text } = body as { text?: string };

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    // Fetch the latest user info to make sure name and profile picture are correct
    const dbUser = await User.findById(user.userId).lean() as any;
    const userName = dbUser?.name || user.name;
    const userProfilePicture = dbUser?.profilePicture || '';

    const comment = await Comment.create({
      tripId: new Types.ObjectId(id),
      userId: new Types.ObjectId(user.userId),
      userName,
      userProfilePicture,
      text: text.trim(),
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      comment: {
        ...comment.toObject(),
        _id: comment._id.toString(),
        tripId: comment.tripId.toString(),
        userId: comment.userId.toString(),
      },
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/trips/[id]/comments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
