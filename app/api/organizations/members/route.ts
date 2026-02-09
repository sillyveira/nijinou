import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Organization from '@/app/models/organization';
import Character from '@/app/models/character';
import Rpg from '@/app/models/rpg';

// POST - Adicionar personagem à organização
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { organizationId, characterId } = body;

    if (!organizationId || !characterId) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
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
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Verify character exists
    const character = await Character.findById(characterId);
    if (!character) {
      return NextResponse.json({ error: 'Personagem não encontrado' }, { status: 404 });
    }

    // Add character to organization if not already there
    if (!organization.characterIds.includes(characterId)) {
      organization.characterIds.push(characterId);
      await organization.save();
    }

    // Add organization to character if not already there
    if (!character.organizationIds.includes(organizationId)) {
      character.organizationIds.push(organizationId);
      await character.save();
    }

    return NextResponse.json({ message: 'Personagem adicionado com sucesso', organization });
  } catch (error) {
    console.error('Erro ao adicionar personagem:', error);
    return NextResponse.json({ error: 'Erro ao adicionar personagem' }, { status: 500 });
  }
}

// DELETE - Remover personagem da organização
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { organizationId, characterId } = body;

    if (!organizationId || !characterId) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
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
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Remove character from organization
    organization.characterIds = organization.characterIds.filter((id: string) => id !== characterId);
    await organization.save();

    // Remove organization from character
    const character = await Character.findById(characterId);
    if (character) {
      character.organizationIds = character.organizationIds.filter((id: string) => id !== organizationId);
      await character.save();
    }

    return NextResponse.json({ message: 'Personagem removido com sucesso', organization });
  } catch (error) {
    console.error('Erro ao remover personagem:', error);
    return NextResponse.json({ error: 'Erro ao remover personagem' }, { status: 500 });
  }
}
