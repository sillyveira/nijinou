import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/app/models/user';

// GET - Buscar todos os usuários (para selecionar membros)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const excludeGroupId = searchParams.get('excludeGroupId');

    let query = {};

    // Se passar um groupId, excluir usuários que já fazem parte
    if (excludeGroupId) {
      query = { groups: { $ne: excludeGroupId } };
    }

    const users = await User.find(query, { password: 0 }); // Excluir senha

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
