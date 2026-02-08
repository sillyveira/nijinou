import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Group from '@/app/models/group';
import { User } from '@/app/models/user';

// GET - Buscar membros de um grupo
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'ID do grupo é obrigatório' }, { status: 400 });
    }

    // Buscar o grupo
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    // Buscar membros (usuários que têm esse grupo no array groups)
    const members = await User.find(
      { groups: groupId },
      { password: 0 } // Excluir senha
    );

    return NextResponse.json({
      group,
      members,
      isOwner: group.ownerId === session.user.id,
    });
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Adicionar membro ao grupo
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { groupId, userId } = await request.json();

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    // Verificar se é o dono
    if (group.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Apenas o dono pode adicionar membros' }, { status: 403 });
    }

    // Adicionar grupo ao usuário
    await User.findByIdAndUpdate(userId, {
      $addToSet: { groups: groupId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Remover membro do grupo
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { groupId, userId } = await request.json();

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    // Verificar se é o dono
    if (group.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Apenas o dono pode remover membros' }, { status: 403 });
    }

    // Não pode remover a si mesmo (dono)
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Você não pode se remover do próprio grupo' }, { status: 400 });
    }

    // Remover grupo do usuário
    await User.findByIdAndUpdate(userId, {
      $pull: { groups: groupId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
