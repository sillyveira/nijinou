import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import CharacterFeats from '@/app/models/characterFeats';
import Character from '@/app/models/character';
import Rpg from '@/app/models/rpg';
import Arc from '@/app/models/arc';
import { User } from '@/app/models/user';

// GET - Buscar characterFeats por arcId ou por ID específico
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const arcId = request.nextUrl.searchParams.get('arcId');
    const rpgId = request.nextUrl.searchParams.get('rpgId');
    const characterFeatId = request.nextUrl.searchParams.get('id');

    if (!rpgId) {
      return NextResponse.json({ error: 'rpgId é obrigatório' }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const rpg = await Rpg.findById(rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    const isRpgOwner = rpg.ownerId === session.user.id;

    // Buscar characterFeat específico
    if (characterFeatId) {
      const characterFeat = await CharacterFeats.findById(characterFeatId);
      if (!characterFeat) {
        return NextResponse.json({ error: 'CharacterFeat não encontrado' }, { status: 404 });
      }

      const isOwner = characterFeat.ownerId === session.user.id;

      // Se é privado, apenas owner ou rpg owner podem ver
      if (characterFeat.private && !isRpgOwner && !isOwner) {
        return NextResponse.json({ error: 'Sem acesso a este characterFeat' }, { status: 403 });
      }

      // Buscar nome do personagem
      const character = await Character.findById(characterFeat.characterId);

      return NextResponse.json({
        characterFeat,
        characterName: character?.name || 'Personagem',
        userId: session.user.id,
        isRpgOwner,
        isOwner,
      });
    }

    // Buscar todos os characterFeats do arco
    if (!arcId) {
      return NextResponse.json({ error: 'arcId é obrigatório' }, { status: 400 });
    }

    const arc = await Arc.findById(arcId);
    if (!arc) {
      return NextResponse.json({ error: 'Arco não encontrado' }, { status: 404 });
    }

    // Buscar todos os characterFeats do arco
    let query: any = { arcId, rpgId };

    const allCharacterFeats = await CharacterFeats.find(query);

    // Filtrar privados: apenas owner ou rpg owner podem ver
    const characterFeats = allCharacterFeats.filter(cf => {
      if (!cf.private) return true;
      return cf.ownerId === session.user?.id || isRpgOwner;
    });

    // Buscar nomes dos personagens
    const characterIds = [...new Set(characterFeats.map(cf => cf.characterId))];
    const characters = await Character.find({ _id: { $in: characterIds } });
    const characterMap = Object.fromEntries(
      characters.map(c => [c._id.toString(), c.name])
    );

    // Adicionar nomes aos characterFeats
    const characterFeatsWithNames = characterFeats.map(cf => ({
      ...cf.toObject(),
      characterName: characterMap[cf.characterId] || 'Personagem',
    }));

    return NextResponse.json({
      characterFeats: characterFeatsWithNames,
      userId: session.user.id,
      isRpgOwner,
    });
  } catch (error) {
    console.error('Erro ao buscar characterFeats:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar novo characterFeat
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { rpgId, arcId, characterId, content, privateFeats } = await request.json();

    if (!rpgId || !arcId || !characterId) {
      return NextResponse.json({ error: 'rpgId, arcId e characterId são obrigatórios' }, { status: 400 });
    }

    // Verificar se já existe
    const existing = await CharacterFeats.findOne({ arcId, characterId });
    if (existing) {
      return NextResponse.json({ error: 'CharacterFeat já existe para este personagem neste arco' }, { status: 400 });
    }

    const characterFeat = await CharacterFeats.create({
      rpgId,
      arcId,
      characterId,
      ownerId: session.user.id,
      content: content || '',
      private: privateFeats || false,
    });

    return NextResponse.json({ characterFeat }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar characterFeat:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar characterFeat
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { characterFeatId, content, privateFeats } = await request.json();

    if (!characterFeatId) {
      return NextResponse.json({ error: 'characterFeatId é obrigatório' }, { status: 400 });
    }

    const characterFeat = await CharacterFeats.findById(characterFeatId);
    if (!characterFeat) {
      return NextResponse.json({ error: 'CharacterFeat não encontrado' }, { status: 404 });
    }

    const rpg = await Rpg.findById(characterFeat.rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    const isRpgOwner = rpg.ownerId === session.user.id;
    const isOwner = characterFeat.ownerId === session.user.id;

    if (!isRpgOwner && !isOwner) {
      return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
    }

    if (typeof content === 'string') characterFeat.content = content;
    if (typeof privateFeats === 'boolean') characterFeat.private = privateFeats;

    await characterFeat.save();

    return NextResponse.json({ characterFeat });
  } catch (error) {
    console.error('Erro ao atualizar characterFeat:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Remover characterFeat
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { characterFeatId } = await request.json();

    const characterFeat = await CharacterFeats.findById(characterFeatId);
    if (!characterFeat) {
      return NextResponse.json({ error: 'CharacterFeat não encontrado' }, { status: 404 });
    }

    const rpg = await Rpg.findById(characterFeat.rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    const isRpgOwner = rpg.ownerId === session.user.id;
    const isOwner = characterFeat.ownerId === session.user.id;

    if (!isRpgOwner && !isOwner) {
      return NextResponse.json({ error: 'Sem permissão para remover' }, { status: 403 });
    }

    await CharacterFeats.findByIdAndDelete(characterFeatId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover characterFeat:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
