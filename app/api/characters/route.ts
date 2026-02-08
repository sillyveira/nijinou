import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Character, { ICharacter } from '@/app/models/character';
import Rpg from '@/app/models/rpg';
import { User } from '@/app/models/user';

// GET - Buscar personagens do RPG que o usuário pode ver
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    // Get query params
    const rpgId = request.nextUrl.searchParams.get('rpgId');
    const characterId = request.nextUrl.searchParams.get('id');

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

    // Se buscar personagem específico
    if (characterId) {
      const character = await Character.findOne({ _id: characterId, rpgId });
      if (!character) {
        return NextResponse.json({ error: 'Personagem não encontrado' }, { status: 404 });
      }

      // Verificar acesso ao personagem
      const isCharacterOwner = character.ownerId === session.user.id;
      const hasGroupAccess = character.groupsAllowed.some((g: string) => userGroupIds.includes(g));
      
      if (!isRpgOwner && !isCharacterOwner && (!hasGroupAccess || character.private)) {
        return NextResponse.json({ error: 'Sem acesso a este personagem' }, { status: 403 });
      }

      return NextResponse.json({ 
        character, 
        userId: session.user.id,
        isRpgOwner,
        isCharacterOwner
      });
    }

    // Buscar todos os personagens do RPG
    let query: any = { rpgId };

    if (!isRpgOwner) {
      // Se não é dono do RPG, só vê personagens permitidos
      query.$or = [
        { ownerId: session.user.id }, // Seus próprios personagens
        { 
          $and: [
            { groupsAllowed: { $in: userGroupIds } }, // Do seu grupo
            { private: false } // E não privados
          ]
        }
      ];
    }

    const characters = await Character.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ 
      characters, 
      userId: session.user.id,
      isRpgOwner
    });
  } catch (error) {
    console.error('Erro ao buscar personagens:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar novo personagem
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { rpgId, name, age, imageUrl, groupsAllowed, privateChar, organizationIds } = await request.json();

    if (!rpgId || !name || age === undefined) {
      return NextResponse.json({ error: 'rpgId, name e age são obrigatórios' }, { status: 400 });
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

    // Criar Sheet
    const Sheet = (await import('@/app/models/sheet')).default;
    const sheet = await Sheet.create({
      rpgId,
      ownerId: session.user.id,
      private: privateChar || false
    });

    // Criar Inventory
    const Inventory = (await import('@/app/models/inventory')).default;
    const inventory = await Inventory.create({
      private: privateChar || false,
      items: [],
      // ownerId não existe, mas private sim
    });

    // Criar o personagem
    const character: ICharacter = await Character.create({
      rpgId,
      ownerId: session.user.id,
      name: name.trim(),
      age,
      imageUrl: imageUrl || '',
      groupsAllowed: groupsAllowed || [],
      organizationIds: organizationIds || [],
      sheetId: sheet._id,
      inventoryId: inventory._id,
      historyIds: []
    });

    return NextResponse.json({ character }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar personagem:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar personagem
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { characterId, name, age, imageUrl, groupsAllowed, privateChar, organizationIds } = await request.json();

    if (!characterId) {
      return NextResponse.json({ error: 'characterId é obrigatório' }, { status: 400 });
    }

    const character = await Character.findById(characterId);
    if (!character) {
      return NextResponse.json({ error: 'Personagem não encontrado' }, { status: 404 });
    }

    // Verificar se é dono do RPG ou dono do personagem
    const rpg = await Rpg.findById(character.rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    const isRpgOwner = rpg.ownerId === session.user.id;
    const isCharacterOwner = character.ownerId === session.user.id;

    if (!isRpgOwner && !isCharacterOwner) {
      return NextResponse.json({ error: 'Apenas o dono do RPG ou do personagem pode editar' }, { status: 403 });
    }

    // Atualizar campos
    if (typeof name === 'string' && name.trim() !== '') {
      character.name = name.trim();
    }
    if (typeof age === 'number') {
      character.age = age;
    }
    if (typeof imageUrl === 'string') {
      character.imageUrl = imageUrl;
    }
    if (Array.isArray(groupsAllowed)) {
      character.groupsAllowed = groupsAllowed;
    }
    if (typeof privateChar === 'boolean') {
      character.private = privateChar;
    }
    if (Array.isArray(organizationIds)) {
      character.organizationIds = organizationIds;
    }
    
    await character.save();

    return NextResponse.json({ character });
  } catch (error) {
    console.error('Erro ao atualizar personagem:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Remover personagem
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { characterId } = await request.json();

    const character = await Character.findById(characterId);
    if (!character) {
      return NextResponse.json({ error: 'Personagem não encontrado' }, { status: 404 });
    }

    // Verificar se é dono do RPG ou dono do personagem
    const rpg = await Rpg.findById(character.rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    const isRpgOwner = rpg.ownerId === session.user.id;
    const isCharacterOwner = character.ownerId === session.user.id;

    if (!isRpgOwner && !isCharacterOwner) {
      return NextResponse.json({ error: 'Apenas o dono do RPG ou do personagem pode remover' }, { status: 403 });
    }

    await Character.findByIdAndDelete(characterId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover personagem:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
