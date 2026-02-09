import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Event from '@/app/models/event';
import Rpg from '@/app/models/rpg';
import Arc from '@/app/models/arc';
import { User } from '@/app/models/user';

// GET - Buscar eventos de um arco
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const rpgId = request.nextUrl.searchParams.get('rpgId');
    const arcId = request.nextUrl.searchParams.get('arcId');
    const eventId = request.nextUrl.searchParams.get('id');

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

    // Buscar evento específico por ID
    if (eventId) {
      const event = await Event.findOne({ _id: eventId, rpgId });
      if (!event) {
        return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
      }

      const isEventOwner = event.ownerId === session.user.id;
      const hasGroupAccess = event.groupsAllowed.some((g: string) => userGroupIds.includes(g));

      if (!isRpgOwner && !isEventOwner && !hasGroupAccess) {
        return NextResponse.json({ error: 'Sem acesso a este evento' }, { status: 403 });
      }

      return NextResponse.json({
        event,
        userId: session.user.id,
        isRpgOwner,
        isEventOwner
      });
    }

    if (!arcId) {
      return NextResponse.json({ error: 'arcId é obrigatório' }, { status: 400 });
    }

    // Verificar acesso ao arco
    const arc = await Arc.findOne({ _id: arcId, rpgId });
    if (!arc) {
      return NextResponse.json({ error: 'Arco não encontrado' }, { status: 404 });
    }

    // Buscar todos os eventos do arco
    let query: any = { rpgId, arcId };

    if (!isRpgOwner) {
      query.$or = [
        { ownerId: session.user.id },
        { groupsAllowed: { $in: userGroupIds } }
      ];
    }

    const events = await Event.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      events,
      userId: session.user.id,
      isRpgOwner
    });
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar novo evento dentro de um arco
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { rpgId, arcId, name, groupsAllowed, characterIds } = await request.json();

    if (!rpgId || !arcId || !name) {
      return NextResponse.json({ error: 'rpgId, arcId e name são obrigatórios' }, { status: 400 });
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

    // Verificar se o arco existe
    const arc = await Arc.findOne({ _id: arcId, rpgId });
    if (!arc) {
      return NextResponse.json({ error: 'Arco não encontrado' }, { status: 404 });
    }

    const event = await Event.create({
      rpgId,
      arcId,
      name: name.trim(),
      ownerId: session.user.id,
      groupsAllowed: groupsAllowed || [],
      characterIds: characterIds || [],
      historyIds: [],
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar evento
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { eventId, name, groupsAllowed, characterIds } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId é obrigatório' }, { status: 400 });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    const rpg = await Rpg.findById(event.rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    const isRpgOwner = rpg.ownerId === session.user.id;
    const isEventOwner = event.ownerId === session.user.id;

    if (!isRpgOwner && !isEventOwner) {
      return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
    }

    if (typeof name === 'string' && name.trim()) event.name = name.trim();
    if (Array.isArray(groupsAllowed)) event.groupsAllowed = groupsAllowed;
    if (Array.isArray(characterIds)) event.characterIds = characterIds;

    await event.save();

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Remover evento
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { eventId } = await request.json();

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    const rpg = await Rpg.findById(event.rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    const isRpgOwner = rpg.ownerId === session.user.id;
    const isEventOwner = event.ownerId === session.user.id;

    if (!isRpgOwner && !isEventOwner) {
      return NextResponse.json({ error: 'Sem permissão para remover' }, { status: 403 });
    }

    await Event.findByIdAndDelete(eventId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover evento:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
