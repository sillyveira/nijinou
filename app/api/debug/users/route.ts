import { connectDB } from '@/lib/mongodb';
import { User } from '@/app/models/user';

export async function GET() {
  try {
    await connectDB();

    // Buscar todos os usuários
    const users = await User.find({}).select('-password');

    return Response.json(
      {
        success: true,
        count: users.length,
        users: users.map((user: any) => ({
          id: user._id,
          username: user.username,
          role: user.role,
          groups: user.groups,
          createdAt: user.createdAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
