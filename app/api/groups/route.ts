import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Group from '@/app/models/group';
import { User } from '@/app/models/user';

// GET - Buscar grupos do usuário
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    // Buscar usuário para pegar os IDs dos grupos
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar grupos que o usuário faz parte
    const groups = await Group.find({ _id: { $in: user.groups } });

    return NextResponse.json({ groups, userId: session.user.id });
  } catch (error) {
    console.error('Erro ao buscar grupos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar novo grupo
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { name, memberIds } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Nome do grupo é obrigatório' }, { status: 400 });
    }

    // Criar o grupo
    const group = await Group.create({
      name: name.trim(),
      ownerId: session.user.id,
    });

    // Adicionar o grupo ao owner
    await User.findByIdAndUpdate(session.user.id, {
      $addToSet: { groups: group._id.toString() },
    });

    // Adicionar o grupo aos membros selecionados
    if (memberIds && memberIds.length > 0) {
      await User.updateMany(
        { _id: { $in: memberIds } },
        { $addToSet: { groups: group._id.toString() } }
      );
    }

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Remover grupo
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const { groupId, confirmName } = await request.json();

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    // Verificar se é o dono
    if (group.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Apenas o dono pode remover o grupo' }, { status: 403 });
    }

    // Verificar nome de confirmação
    if (confirmName !== group.name) {
      return NextResponse.json({ error: 'Nome de confirmação incorreto' }, { status: 400 });
    }

    // Remover o grupo de todos os usuários
    await User.updateMany(
      { groups: groupId },
      { $pull: { groups: groupId } }
    );

    // Deletar o grupo
    await Group.findByIdAndDelete(groupId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover grupo:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
