import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Arc from '@/app/models/arc';
import Rpg from '@/app/models/rpg';
import { User } from '@/app/models/user';

// GET - Buscar arcos do RPG
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const rpgId = request.nextUrl.searchParams.get('rpgId');
    const arcId = request.nextUrl.searchParams.get('id');

    if (!rpgId) {
      return NextResponse.json({ error: 'rpgId é obrigatório' }, { status: 400 });
    }

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

    if (arcId) {
      const arc = await Arc.findOne({ _id: arcId, rpgId });
      if (!arc) {
        return NextResponse.json({ error: 'Arco não encontrado' }, { status: 404 });
      }

      const isArcOwner = arc.ownerId === session.user.id;
      const hasGroupAccess = arc.groupsAllowed.some((g: string) => userGroupIds.includes(g));

      if (!isRpgOwner && !isArcOwner && !hasGroupAccess) {
        return NextResponse.json({ error: 'Sem acesso a este arco' }, { status: 403 });
      }

      return NextResponse.json({
        arc,
        userId: session.user.id,
        isRpgOwner,
        isArcOwner
      });
    }

    // Buscar todos os arcos
    let query: any = { rpgId };

    if (!isRpgOwner) {
      query.$or = [
        { ownerId: session.user.id },
        { groupsAllowed: { $in: userGroupIds } }
      ];
    }

    const arcs = await Arc.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      arcs,
      userId: session.user.id,
      isRpgOwner
    });
  } catch (error) {
    console.error('Erro ao buscar arcos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar novo arco
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { rpgId, name, groupsAllowed } = await request.json();

    if (!rpgId || !name) {
      return NextResponse.json({ error: 'rpgId e name são obrigatórios' }, { status: 400 });
    }

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

    const arc = await Arc.create({
      rpgId,
      name: name.trim(),
      ownerId: session.user.id,
      groupsAllowed: groupsAllowed || [],
      historyIds: [],
    });

    return NextResponse.json({ arc }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar arco:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar arco
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { arcId, name, groupsAllowed } = await request.json();

    if (!arcId) {
      return NextResponse.json({ error: 'arcId é obrigatório' }, { status: 400 });
    }

    const arc = await Arc.findById(arcId);
    if (!arc) {
      return NextResponse.json({ error: 'Arco não encontrado' }, { status: 404 });
    }

    const rpg = await Rpg.findById(arc.rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    const isRpgOwner = rpg.ownerId === session.user.id;
    const isArcOwner = arc.ownerId === session.user.id;

    if (!isRpgOwner && !isArcOwner) {
      return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
    }

    if (typeof name === 'string' && name.trim()) arc.name = name.trim();
    if (Array.isArray(groupsAllowed)) arc.groupsAllowed = groupsAllowed;

    await arc.save();

    return NextResponse.json({ arc });
  } catch (error) {
    console.error('Erro ao atualizar arco:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Remover arco
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { arcId } = await request.json();

    const arc = await Arc.findById(arcId);
    if (!arc) {
      return NextResponse.json({ error: 'Arco não encontrado' }, { status: 404 });
    }

    const rpg = await Rpg.findById(arc.rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    const isRpgOwner = rpg.ownerId === session.user.id;
    const isArcOwner = arc.ownerId === session.user.id;

    if (!isRpgOwner && !isArcOwner) {
      return NextResponse.json({ error: 'Sem permissão para remover' }, { status: 403 });
    }

    await Arc.findByIdAndDelete(arcId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover arco:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
