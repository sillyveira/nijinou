
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Rpg from '@/app/models/rpg';
import { User } from '@/app/models/user';

// GET - Buscar RPGs que o usuário tem acesso
export async function GET() {
  try {
    // Accept request param for Next.js API route
    const request = arguments[0];
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    // Get query params from request
    let rpgId = undefined;
    if (request && request.nextUrl) {
      rpgId = request.nextUrl.searchParams.get('id');
    }

    // Buscar grupos do usuário
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    const userGroupIds = user.groups || [];

    if (rpgId) {
      // Buscar RPG específico com acesso
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
      return NextResponse.json({ rpg, userId: session.user.id });
    }

    // Buscar RPGs onde o usuário é dono OU faz parte de algum grupo permitido
    const rpgs = await Rpg.find({
      $or: [
        { ownerId: session.user.id },
        { groupsAllowed: { $in: userGroupIds } }
      ]
    }).sort({ createdAt: -1 });

    return NextResponse.json({ rpgs, userId: session.user.id });
  } catch (error) {
    console.error('Erro ao buscar RPGs:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar novo RPG
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { name, imageUrl, groupsAllowed } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Nome do RPG é obrigatório' }, { status: 400 });
    }

    // Criar o RPG
    const rpg = await Rpg.create({
      name: name.trim(),
      ownerId: session.user.id,
      imageUrl: imageUrl || '',
      groupsAllowed: groupsAllowed || [],
    });

    return NextResponse.json({ rpg }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar RPG:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Remover RPG
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { rpgId } = await request.json();

    const rpg = await Rpg.findById(rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    // Verificar se é o dono
    if (rpg.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Apenas o dono pode remover o RPG' }, { status: 403 });
    }

    await Rpg.findByIdAndDelete(rpgId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover RPG:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar RPG (nome, gruposAllowed)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { rpgId, name, groupsAllowed } = await request.json();
    if (!rpgId) {
      return NextResponse.json({ error: 'ID do RPG é obrigatório' }, { status: 400 });
    }

    const rpg = await Rpg.findById(rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    // Verificar se é o dono
    if (rpg.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Apenas o dono pode editar o RPG' }, { status: 403 });
    }

    // Atualizar campos
    if (typeof name === 'string' && name.trim() !== '') {
      rpg.name = name.trim();
    }
    if (Array.isArray(groupsAllowed)) {
      rpg.groupsAllowed = groupsAllowed;
    }
    await rpg.save();

    return NextResponse.json({ rpg });
  } catch (error) {
    console.error('Erro ao atualizar RPG:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}