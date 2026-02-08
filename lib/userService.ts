import { connectDB } from '@/lib/mongodb';
import { User } from '@/app/models/user';
import bcrypt from 'bcryptjs';

export async function createUser(
  username: string,
  password: string,
  role: string = 'user',
  groups: string[] = []
) {
  try {
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      password: hashedPassword,
      role,
      groups,
    });

    return {
      success: true,
      message: 'User created successfully',
      userId: user._id,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}
