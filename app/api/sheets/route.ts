import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Sheet from '@/app/models/sheet';
import Character from '@/app/models/character';
import Rpg from '@/app/models/rpg';
import { User } from '@/app/models/user';

// GET - Buscar ficha por ID
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const sheetId = request.nextUrl.searchParams.get('id');

    if (!sheetId) {
      return NextResponse.json({ error: 'sheetId é obrigatório' }, { status: 400 });
    }

    const sheet = await Sheet.findById(sheetId);
    if (!sheet) {
      return NextResponse.json({ error: 'Ficha não encontrada' }, { status: 404 });
    }

    // Buscar personagem para verificar permissões
    const character = await Character.findOne({ sheetId: sheet._id.toString() });
    if (!character) {
      return NextResponse.json({ error: 'Personagem não encontrado' }, { status: 404 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const rpg = await Rpg.findById(character.rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    const isRpgOwner = rpg.ownerId === session.user.id;
    const isCharacterOwner = character.ownerId === session.user.id;

    // Se a ficha é privada, apenas o dono do personagem e dono do RPG podem ver
    if (sheet.private && !isRpgOwner && !isCharacterOwner) {
      return NextResponse.json({ error: 'Sem acesso a esta ficha' }, { status: 403 });
    }

    return NextResponse.json({
      sheet,
      userId: session.user.id,
      isRpgOwner,
      isCharacterOwner,
    });
  } catch (error) {
    console.error('Erro ao buscar ficha:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar ficha
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { sheetId, content, privateSheet } = await request.json();

    if (!sheetId) {
      return NextResponse.json({ error: 'sheetId é obrigatório' }, { status: 400 });
    }

    const sheet = await Sheet.findById(sheetId);
    if (!sheet) {
      return NextResponse.json({ error: 'Ficha não encontrada' }, { status: 404 });
    }

    // Buscar personagem para verificar permissões
    const character = await Character.findOne({ sheetId: sheet._id.toString() });
    if (!character) {
      return NextResponse.json({ error: 'Personagem não encontrado' }, { status: 404 });
    }

    const rpg = await Rpg.findById(character.rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    const isRpgOwner = rpg.ownerId === session.user.id;
    const isCharacterOwner = character.ownerId === session.user.id;

    // Apenas dono do personagem ou dono do RPG podem editar
    if (!isRpgOwner && !isCharacterOwner) {
      return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
    }

    if (typeof content === 'string') sheet.content = content;
    if (typeof privateSheet === 'boolean') sheet.private = privateSheet;

    await sheet.save();

    return NextResponse.json({ sheet });
  } catch (error) {
    console.error('Erro ao atualizar ficha:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
