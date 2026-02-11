import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import PowerSection from '@/app/models/power-section';
import Character from '@/app/models/character';
import Rpg from '@/app/models/rpg';

// GET - Buscar seções de poderes de um personagem
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const rpgId = searchParams.get('rpgId');
    const characterId = searchParams.get('characterId');

    if (!rpgId || !characterId) {
      return NextResponse.json({ error: 'rpgId e characterId são obrigatórios' }, { status: 400 });
    }

    const rpg = await Rpg.findById(rpgId);
    const isRpgOwner = rpg?.ownerId === session.user.id;

    const character = await Character.findById(characterId);
    const isCharOwner = character?.ownerId === session.user.id;

    const sections = await PowerSection.find({ rpgId, characterId }).sort({ createdAt: -1 });

    // Filter private sections
    const filtered = sections.filter((s) => {
      if (!s.private) return true;
      if (s.ownerId === session.user!.id) return true;
      if (isRpgOwner) return true;
      return false;
    });

    return NextResponse.json({ sections: filtered, isRpgOwner, isCharOwner });
  } catch (error) {
    console.error('Erro ao buscar seções de poderes:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar nova seção de poderes
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { rpgId, characterId, name, imageUrl, private: isPrivate } = body;

    if (!rpgId || !characterId || !name) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Verify permissions
    const rpg = await Rpg.findById(rpgId);
    const isRpgOwner = rpg?.ownerId === session.user.id;
    const character = await Character.findById(characterId);
    const isCharOwner = character?.ownerId === session.user.id;

    if (!isRpgOwner && !isCharOwner) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const section = await PowerSection.create({
      rpgId,
      characterId,
      ownerId: session.user.id,
      name,
      imageUrl: imageUrl || '',
      private: isPrivate || false,
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar seção de poderes:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar seção de poderes
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { sectionId, name, imageUrl, private: isPrivate } = body;

    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId é obrigatório' }, { status: 400 });
    }

    const section = await PowerSection.findById(sectionId);
    if (!section) {
      return NextResponse.json({ error: 'Seção não encontrada' }, { status: 404 });
    }

    const rpg = await Rpg.findById(section.rpgId);
    const isRpgOwner = rpg?.ownerId === session.user.id;
    const isOwner = section.ownerId === session.user.id;

    if (!isRpgOwner && !isOwner) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    if (name !== undefined) section.name = name;
    if (imageUrl !== undefined) section.imageUrl = imageUrl;
    if (isPrivate !== undefined) section.private = isPrivate;

    await section.save();

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Erro ao atualizar seção:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Deletar seção de poderes e todos os seus poderes
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { sectionId } = body;

    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId é obrigatório' }, { status: 400 });
    }

    const section = await PowerSection.findById(sectionId);
    if (!section) {
      return NextResponse.json({ error: 'Seção não encontrada' }, { status: 404 });
    }

    const rpg = await Rpg.findById(section.rpgId);
    const isRpgOwner = rpg?.ownerId === session.user.id;
    const isOwner = section.ownerId === session.user.id;

    if (!isRpgOwner && !isOwner) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Delete all powers in this section
    const Power = (await import('@/app/models/power')).default;
    await Power.deleteMany({ sectionId });

    await PowerSection.findByIdAndDelete(sectionId);

    return NextResponse.json({ message: 'Seção deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar seção:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
