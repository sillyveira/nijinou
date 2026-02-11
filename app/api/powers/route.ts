import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Power from '@/app/models/power';
import PowerSection from '@/app/models/power-section';
import Character from '@/app/models/character';
import Rpg from '@/app/models/rpg';

// GET - Buscar poderes de uma seção
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get('sectionId');
    const powerId = searchParams.get('powerId');

    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId é obrigatório' }, { status: 400 });
    }

    const section = await PowerSection.findById(sectionId);
    if (!section) {
      return NextResponse.json({ error: 'Seção não encontrada' }, { status: 404 });
    }

    const rpg = await Rpg.findById(section.rpgId);
    const isRpgOwner = rpg?.ownerId === session.user.id;
    const character = await Character.findById(section.characterId);
    const isCharOwner = character?.ownerId === session.user.id;

    // If requesting a specific power
    if (powerId) {
      const power = await Power.findById(powerId);
      if (!power) {
        return NextResponse.json({ error: 'Poder não encontrado' }, { status: 404 });
      }

      // Privacy check
      if (power.private && power.ownerId !== session.user.id && !isRpgOwner) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }

      return NextResponse.json({
        power,
        section,
        isRpgOwner,
        isCharOwner,
        canEdit: isRpgOwner || isCharOwner,
      });
    }

    // Get all powers in section
    const powers = await Power.find({ sectionId }).sort({ createdAt: -1 });

    // Filter private
    const filtered = powers.filter((p) => {
      if (!p.private) return true;
      if (p.ownerId === session.user!.id) return true;
      if (isRpgOwner) return true;
      return false;
    });

    return NextResponse.json({
      powers: filtered,
      section,
      isRpgOwner,
      isCharOwner,
      canEdit: isRpgOwner || isCharOwner,
    });
  } catch (error) {
    console.error('Erro ao buscar poderes:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar novo poder
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { rpgId, characterId, sectionId, name, imageUrl, powerType, private: isPrivate } = body;

    if (!rpgId || !characterId || !sectionId || !name || !powerType) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    if (!['skill', 'transformation'].includes(powerType)) {
      return NextResponse.json({ error: 'powerType deve ser skill ou transformation' }, { status: 400 });
    }

    // Verify section exists
    const section = await PowerSection.findById(sectionId);
    if (!section) {
      return NextResponse.json({ error: 'Seção não encontrada' }, { status: 404 });
    }

    // Verify permissions
    const rpg = await Rpg.findById(rpgId);
    const isRpgOwner = rpg?.ownerId === session.user.id;
    const character = await Character.findById(characterId);
    const isCharOwner = character?.ownerId === session.user.id;

    if (!isRpgOwner && !isCharOwner) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const power = await Power.create({
      rpgId,
      characterId,
      sectionId,
      ownerId: session.user.id,
      name,
      imageUrl: imageUrl || '',
      content: '',
      powerType,
      private: isPrivate || false,
    });

    return NextResponse.json({ power }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar poder:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar poder (conteúdo, nome, imagem, privacidade)
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { powerId, name, imageUrl, content, private: isPrivate } = body;

    if (!powerId) {
      return NextResponse.json({ error: 'powerId é obrigatório' }, { status: 400 });
    }

    const power = await Power.findById(powerId);
    if (!power) {
      return NextResponse.json({ error: 'Poder não encontrado' }, { status: 404 });
    }

    const rpg = await Rpg.findById(power.rpgId);
    const isRpgOwner = rpg?.ownerId === session.user.id;
    const character = await Character.findById(power.characterId);
    const isCharOwner = character?.ownerId === session.user.id;

    if (!isRpgOwner && !isCharOwner) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    if (name !== undefined) power.name = name;
    if (imageUrl !== undefined) power.imageUrl = imageUrl;
    if (content !== undefined) power.content = content;
    if (isPrivate !== undefined) power.private = isPrivate;

    await power.save();

    return NextResponse.json({ power });
  } catch (error) {
    console.error('Erro ao atualizar poder:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Deletar poder
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { powerId } = body;

    if (!powerId) {
      return NextResponse.json({ error: 'powerId é obrigatório' }, { status: 400 });
    }

    const power = await Power.findById(powerId);
    if (!power) {
      return NextResponse.json({ error: 'Poder não encontrado' }, { status: 404 });
    }

    const rpg = await Rpg.findById(power.rpgId);
    const isRpgOwner = rpg?.ownerId === session.user.id;
    const character = await Character.findById(power.characterId);
    const isCharOwner = character?.ownerId === session.user.id;

    if (!isRpgOwner && !isCharOwner) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    await Power.findByIdAndDelete(powerId);

    return NextResponse.json({ message: 'Poder deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar poder:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
