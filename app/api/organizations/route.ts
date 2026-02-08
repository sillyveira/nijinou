import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Organization from '@/app/models/organization';
import Rpg from '@/app/models/rpg';
import { User } from '@/app/models/user';

// GET - Buscar organizações do RPG que o usuário pode ver
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const rpgId = request.nextUrl.searchParams.get('rpgId');

    if (!rpgId) {
      return NextResponse.json({ error: 'rpgId é obrigatório' }, { status: 400 });
    }

    // Verificar se o usuário tem acesso ao RPG
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    const userGroupIds = user.groups || [];

    const rpg = await Rpg.findOne({
      _id: rpgId,
      $or: [
        { ownerId: session.user.id },
        { groupsAllowed: { $in: userGroupIds } }
      ]
    });

    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado ou sem acesso' }, { status: 404 });
    }

    const isRpgOwner = rpg.ownerId === session.user.id;

    // Buscar organizações
    let query: any = { rpgId };

    if (!isRpgOwner) {
      // Se não é dono do RPG, só vê organizações não privadas ou do seu grupo
      query.$or = [
        { 
          $and: [
            { groupsAllowed: { $in: userGroupIds } },
            { private: false }
          ]
        }
      ];
    }

    const organizations = await Organization.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ organizations, isRpgOwner });
  } catch (error) {
    console.error('Erro ao buscar organizações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
