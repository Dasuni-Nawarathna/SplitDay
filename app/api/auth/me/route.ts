import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET() {
  const tokenUser = await getAuthUser();
  if (!tokenUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  await connectDB();
  const dbUser = (await User.findById(tokenUser.userId).lean()) as any;
  if (!dbUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      userId: dbUser._id.toString(),
      email: dbUser.email,
      name: dbUser.name,
      profilePicture: dbUser.profilePicture || '',
    },
  });
}
