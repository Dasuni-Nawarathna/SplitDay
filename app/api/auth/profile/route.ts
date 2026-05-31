import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function PUT(req: NextRequest) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { name, profilePicture } = body as { name?: string; profilePicture?: string };

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      tokenUser.userId,
      {
        name: name.trim(),
        profilePicture: profilePicture || '',
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        userId: updatedUser._id.toString(),
        email: updatedUser.email,
        name: updatedUser.name,
        profilePicture: updatedUser.profilePicture || '',
      },
    });
  } catch (err) {
    console.error('[PUT /api/auth/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
