import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Organization from '@/app/models/organization';
import Rpg from '@/app/models/rpg';
import { User } from '@/app/models/user';

// GET - Buscar organizações do RPG que o usuário pode ver
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const rpgId = request.nextUrl.searchParams.get('rpgId');

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

    // Buscar organizações
    let query: any = { rpgId };

    if (!isRpgOwner) {
      // Se não é dono do RPG, só vê organizações não privadas ou do seu grupo
      query.$or = [
        { 
          $and: [
            { groupsAllowed: { $in: userGroupIds } },
            { private: false }
          ]
        }
      ];
    }

    const organizations = await Organization.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ organizations, isRpgOwner });
  } catch (error) {
    console.error('Erro ao buscar organizações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { rpgId, name, since, imageUrl, private: isPrivate, groupsAllowed } = body;

    if (!rpgId || !name || !since) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Verify RPG exists
    const rpg = await Rpg.findById(rpgId);
    if (!rpg) {
      return NextResponse.json({ error: 'RPG não encontrado' }, { status: 404 });
    }

    const newOrganization = await Organization.create({
      rpgId: [rpgId],
      name,
      since,
      imageUrl: imageUrl || '',
      ownerId: [session.user.id],
      private: isPrivate || false,
      groupsAllowed: groupsAllowed || [],
      historyIds: [],
      characterIds: [],
    });

    return NextResponse.json({ organization: newOrganization }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar organização:', error);
    return NextResponse.json({ error: 'Erro ao criar organização' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { organizationId, name, since, imageUrl, private: isPrivate, groupsAllowed } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId é obrigatório' }, { status: 400 });
    }

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    // Check permissions (RPG owner or organization owner)
    const rpg = await Rpg.findById(organization.rpgId[0]);
    const isRpgOwner = rpg?.ownerId === session.user.id;
    const isOrgOwner = organization.ownerId.includes(session.user.id);

    if (!isRpgOwner && !isOrgOwner) {
      return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
    }

    // Update fields
    if (name !== undefined) organization.name = name;
    if (since !== undefined) organization.since = since;
    if (imageUrl !== undefined) organization.imageUrl = imageUrl;
    if (isPrivate !== undefined) organization.private = isPrivate;
    if (groupsAllowed !== undefined) organization.groupsAllowed = groupsAllowed;

    await organization.save();

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Erro ao atualizar organização:', error);
    return NextResponse.json({ error: 'Erro ao atualizar organização' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId é obrigatório' }, { status: 400 });
    }

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    // Check permissions (RPG owner or organization owner)
    const rpg = await Rpg.findById(organization.rpgId[0]);
    const isRpgOwner = rpg?.ownerId === session.user.id;
    const isOrgOwner = organization.ownerId.includes(session.user.id);

    if (!isRpgOwner && !isOrgOwner) {
      return NextResponse.json({ error: 'Sem permissão para deletar' }, { status: 403 });
    }

    await Organization.findByIdAndDelete(organizationId);

    return NextResponse.json({ message: 'Organização deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar organização:', error);
    return NextResponse.json({ error: 'Erro ao deletar organização' }, { status: 500 });
  }
}
