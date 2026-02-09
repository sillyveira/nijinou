import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import History from '@/app/models/history';
import Character from '@/app/models/character';
import Arc from '@/app/models/arc';
import Event from '@/app/models/event';
import Rpg from '@/app/models/rpg';
import { User } from '@/app/models/user';

// GET - Buscar histórias por IDs (passados via query)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const rpgId = request.nextUrl.searchParams.get('rpgId');
    const historyId = request.nextUrl.searchParams.get('id');
    const ids = request.nextUrl.searchParams.get('ids'); // comma-separated

    if (!rpgId) {
      return NextResponse.json({ error: 'rpgId é obrigatório' }, { status: 400 });
    }

    // Verificar acesso ao RPG
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

    // Buscar história específica
    if (historyId) {
      const history = await History.findOne({ _id: historyId, rpgId });
      if (!history) {
        return NextResponse.json({ error: 'História não encontrada' }, { status: 404 });
      }

      const isHistoryOwner = history.ownerId === session.user.id;

      if (!isRpgOwner && !isHistoryOwner && history.private) {
        return NextResponse.json({ error: 'Sem acesso a esta história' }, { status: 403 });
      }

      return NextResponse.json({
        history,
        userId: session.user.id,
        isRpgOwner,
        isHistoryOwner
      });
    }

    // Buscar múltiplas por IDs
    if (ids) {
      const idList = ids.split(',').filter(Boolean);
      let query: any = { _id: { $in: idList }, rpgId };

      if (!isRpgOwner) {
        query.$or = [
          { ownerId: session.user.id },
          { private: false }
        ];
      }

      const histories = await History.find(query).sort({ createdAt: -1 });

      return NextResponse.json({
        histories,
        userId: session.user.id,
        isRpgOwner
      });
    }

    return NextResponse.json({ error: 'id ou ids é obrigatório' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao buscar histórias:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar nova história e vincular ao parent (character, arc ou event)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const {
      rpgId,
      parentId,
      parentType, // 'character' | 'arc' | 'event'
      chapterName,
      content,
      year,
      imageUrl,
      characterIds,
      privateHistory
    } = await request.json();

    if (!rpgId || !parentId || !parentType || !chapterName || !content) {
      return NextResponse.json({ error: 'rpgId, parentId, parentType, chapterName e content são obrigatórios' }, { status: 400 });
    }

    // Verificar acesso ao RPG
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

    // Criar a história
    const history = await History.create({
      rpgId,
      chapterName: chapterName.trim(),
      content,
      ownerId: session.user.id,
      updatedById: session.user.id,
      private: privateHistory || false,
      characterIds: characterIds || [],
      year: year || undefined,
      imageUrl: imageUrl || undefined,
    });

    // Vincular ao parent
    if (parentType === 'character') {
      await Character.findByIdAndUpdate(parentId, {
        $push: { historyIds: history._id.toString() }
      });
    } else if (parentType === 'arc') {
      await Arc.findByIdAndUpdate(parentId, {
        $push: { historyIds: history._id.toString() }
      });
    } else if (parentType === 'event') {
      await Event.findByIdAndUpdate(parentId, {
        $push: { historyIds: history._id.toString() }
      });
    }

    return NextResponse.json({ history }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar história:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar história (todos podem editar)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { historyId, chapterName, content, year, imageUrl, characterIds, privateHistory } = await request.json();

    if (!historyId) {
      return NextResponse.json({ error: 'historyId é obrigatório' }, { status: 400 });
    }

    const history = await History.findById(historyId);
    if (!history) {
      return NextResponse.json({ error: 'História não encontrada' }, { status: 404 });
    }

    // Verificar acesso ao RPG
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    const userGroupIds = user.groups || [];

    const rpg = await Rpg.findOne({
      _id: history.rpgId,
      $or: [
        { ownerId: session.user.id },
        { groupsAllowed: { $in: userGroupIds } }
      ]
    });

    if (!rpg) {
      return NextResponse.json({ error: 'Sem acesso ao RPG' }, { status: 403 });
    }

    // Todos que têm acesso ao RPG podem editar
    if (typeof chapterName === 'string' && chapterName.trim()) {
      history.chapterName = chapterName.trim();
    }
    if (typeof content === 'string') {
      history.content = content;
    }
    if (year !== undefined) {
      history.year = year;
    }
    if (typeof imageUrl === 'string') {
      history.imageUrl = imageUrl;
    }
    if (Array.isArray(characterIds)) {
      history.characterIds = characterIds;
    }
    if (typeof privateHistory === 'boolean') {
      history.private = privateHistory;
    }

    history.updatedById = session.user.id;

    await history.save();

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Erro ao atualizar história:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Remover história (somente owner do personagem/arc/event ou owner do RPG)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { historyId, parentId, parentType } = await request.json();

    if (!historyId) {
      return NextResponse.json({ error: 'historyId é obrigatório' }, { status: 400 });
    }

    const history = await History.findById(historyId);
    if (!history) {
      return NextResponse.json({ error: 'História não encontrada' }, { status: 404 });
    }

    const rpg = await Rpg.findById(history.rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    const isRpgOwner = rpg.ownerId === session.user.id;
    const isHistoryOwner = history.ownerId === session.user.id;

    // Verificar se é owner do parent
    let isParentOwner = false;
    if (parentId && parentType) {
      if (parentType === 'character') {
        const char = await Character.findById(parentId);
        if (char && char.ownerId === session.user.id) isParentOwner = true;
      } else if (parentType === 'arc') {
        const arc = await Arc.findById(parentId);
        if (arc && arc.ownerId === session.user.id) isParentOwner = true;
      } else if (parentType === 'event') {
        const event = await Event.findById(parentId);
        if (event && event.ownerId === session.user.id) isParentOwner = true;
      }
    }

    if (!isRpgOwner && !isHistoryOwner && !isParentOwner) {
      return NextResponse.json({ error: 'Sem permissão para remover esta história' }, { status: 403 });
    }

    // Remover referência do parent
    if (parentId && parentType) {
      if (parentType === 'character') {
        await Character.findByIdAndUpdate(parentId, { $pull: { historyIds: historyId } });
      } else if (parentType === 'arc') {
        await Arc.findByIdAndUpdate(parentId, { $pull: { historyIds: historyId } });
      } else if (parentType === 'event') {
        await Event.findByIdAndUpdate(parentId, { $pull: { historyIds: historyId } });
      }
    }

    await History.findByIdAndDelete(historyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover história:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
