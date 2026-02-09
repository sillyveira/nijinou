'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  Loader2,
  Building2,
  ArrowLeft,
  ScrollText,
  Users,
  Search,
  Crown,
  EyeOff,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import HistoryPageBase from '@/app/components/HistoryPageBase';

interface Organization {
  _id: string;
  name: string;
  since: string;
  rpgId: string[];
  ownerId: string[];
  private: boolean;
  groupsAllowed: string[];
  historyIds: string[];
  characterIds: string[];
  imageUrl: string;
}

interface Character {
  _id: string;
  name: string;
  ownerId: string;
  private: boolean;
  imageUrl: string;
}

type Tab = 'historias' | 'personagens';

export default function OrganizationDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;
  const organizationId = params?.organizationId as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isRpgOwner, setIsRpgOwner] = useState(false);
  const [isOrgOwner, setIsOrgOwner] = useState(false);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>('historias');

  // Characters state
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [searchCharacterName, setSearchCharacterName] = useState('');

  // Add character modal
  const [addCharacterOpen, setAddCharacterOpen] = useState(false);
  const [searchCharacterModal, setSearchCharacterModal] = useState('');
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      if (!rpgId || !organizationId) return;

      try {
        // Fetch organization
        const orgRes = await fetch(`/api/organizations?rpgId=${rpgId}`);
        const orgData = await orgRes.json();
        const org = orgData.organizations?.find((o: Organization) => o._id === organizationId);
        
        if (org) {
          setOrganization(org);
          setIsRpgOwner(orgData.isRpgOwner || false);
          setIsOrgOwner(org.ownerId.includes(session?.user?.id || ''));
        }

        // Fetch all characters to filter by organization
        const charRes = await fetch(`/api/characters?rpgId=${rpgId}`);
        const charData = await charRes.json();
        
        if (charData.characters && org) {
          // Filter characters that belong to this organization
          const orgCharacters = charData.characters.filter((char: Character) => 
            org.characterIds.includes(char._id)
          );
          setCharacters(orgCharacters);
        }

        setCharactersLoading(false);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated' && session?.user?.id) {
      setUserId(session.user.id);
      fetchData();
    }
  }, [status, rpgId, organizationId, session]);

  useEffect(() => {
    async function fetchAvailableCharacters() {
      if (!rpgId || !organization) return;
      try {
        const res = await fetch(`/api/characters?rpgId=${rpgId}`);
        const data = await res.json();
        if (data.characters) {
          // Filter out characters already in the organization
          const notInOrg = data.characters.filter((char: Character) => 
            !organization.characterIds.includes(char._id)
          );
          setAvailableCharacters(notInOrg);
        }
      } catch (error) {
        console.error('Erro ao buscar personagens:', error);
      }
    }
    if (addCharacterOpen) fetchAvailableCharacters();
  }, [addCharacterOpen, rpgId, organization]);

  const handleAddCharacter = async () => {
    if (!selectedCharacterId || !organization) return;
    setSaving(true);
    try {
      const res = await fetch('/api/organizations/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization._id,
          characterId: selectedCharacterId,
        }),
      });
      if (res.ok) {
        // Add character to local state
        const addedChar = availableCharacters.find(c => c._id === selectedCharacterId);
        if (addedChar) {
          setCharacters(prev => [...prev, addedChar]);
          setOrganization(prev => prev ? {
            ...prev,
            characterIds: [...prev.characterIds, selectedCharacterId]
          } : null);
        }
        setAddCharacterOpen(false);
        setSelectedCharacterId(null);
        setSearchCharacterModal('');
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao adicionar personagem');
      }
    } catch (error) {
      console.error('Erro ao adicionar personagem:', error);
      alert('Erro ao adicionar personagem');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCharacter = async (characterId: string) => {
    if (!organization) return;
    if (!confirm('Deseja remover este personagem da organização?')) return;

    try {
      const res = await fetch('/api/organizations/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization._id,
          characterId,
        }),
      });
      if (res.ok) {
        setCharacters(prev => prev.filter(c => c._id !== characterId));
        setOrganization(prev => prev ? {
          ...prev,
          characterIds: prev.characterIds.filter(id => id !== characterId)
        } : null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao remover personagem');
      }
    } catch (error) {
      console.error('Erro ao remover personagem:', error);
      alert('Erro ao remover personagem');
    }
  };

  const filteredCharacters = characters.filter(char =>
    char.name.toLowerCase().includes(searchCharacterName.toLowerCase())
  );

  const filteredCharactersModal = availableCharacters.filter(char =>
    char.name.toLowerCase().includes(searchCharacterModal.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Building2 size={48} className="text-zinc-700" />
        <span className="ml-4 text-zinc-400 text-lg">Organização não encontrada</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-700 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => router.push(`/organizations/${rpgId}`)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Voltar às Organizações
          </button>

          <div className="flex items-start gap-4">
            {/* Image or icon */}
            {organization.imageUrl ? (
              <img 
                src={organization.imageUrl} 
                alt={organization.name} 
                className="w-24 h-24 rounded-lg object-cover border border-zinc-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-linear-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center">
                <Building2 size={40} className="text-zinc-600" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">{organization.name}</h1>
                  <p className="text-zinc-400">Fundada em {organization.since}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {organization.private && (
                    <div className="flex items-center gap-1 bg-red-500/20 px-3 py-1 rounded-full">
                      <EyeOff size={14} className="text-red-400" />
                      <span className="text-red-400 text-sm">Privado</span>
                    </div>
                  )}
                  {isOrgOwner && (
                    <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                      <Crown size={14} className="text-yellow-400" />
                      <span className="text-yellow-400 text-sm">Dono</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          <button
            onClick={() => setActiveTab('historias')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'historias'
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <ScrollText size={18} />
            Histórias
          </button>
          <button
            onClick={() => setActiveTab('personagens')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'personagens'
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Users size={18} />
            Personagens
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'historias' ? (
        <HistoryPageBase
          rpgId={rpgId}
          parentId={organizationId}
          parentType="organization"
          parentName={organization.name}
          historyIds={organization.historyIds || []}
          isRpgOwner={isRpgOwner}
          isParentOwner={isOrgOwner}
          backUrl={`/organizations/${rpgId}`}
          editorBasePath={`/organizations/${rpgId}/${organizationId}`}
        />
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8 pb-12">
          {/* Header with Add button */}
          {(isOrgOwner || isRpgOwner) && (
            <div className="flex items-center justify-end mb-6">
              <button
                onClick={() => setAddCharacterOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                <Plus size={20} />
                Adicionar Personagem
              </button>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchCharacterName}
                onChange={(e) => setSearchCharacterName(e.target.value)}
                placeholder="Buscar personagem..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Characters list */}
          {charactersLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={36} />
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Users size={64} className="text-zinc-700 mb-4" />
              <p className="text-zinc-500 text-lg">Nenhum personagem encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCharacters.map((char) => (
                <div
                  key={char._id}
                  className="relative group bg-linear-to-br from-zinc-800 to-zinc-900 hover:from-primary/20 hover:to-primary/5 border border-zinc-700 hover:border-primary/40 rounded-xl overflow-hidden transition-all shadow-lg"
                >
                  <button
                    onClick={() => router.push(`/characters/${rpgId}/${char._id}`)}
                    className="w-full text-left"
                  >
                    {/* Character image or placeholder */}
                    {char.imageUrl ? (
                      <img src={char.imageUrl} alt={char.name} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-linear-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                        <Users size={32} className="text-zinc-600" />
                      </div>
                    )}

                    {/* Character info */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-white">{char.name}</h3>
                    </div>
                  </button>

                  {/* Privacy badge */}
                  {char.private && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded-full">
                      <EyeOff size={12} className="text-red-400" />
                      <span className="text-red-400 text-xs">Privado</span>
                    </div>
                  )}

                  {/* Remove button */}
                  {(isOrgOwner || isRpgOwner) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveCharacter(char._id); }}
                      className="absolute bottom-3 right-3 p-1.5 bg-red-900/40 hover:bg-red-800/60 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de adicionar personagem */}
      {addCharacterOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-white">Adicionar Personagem</h2>
              <button 
                onClick={() => {
                  setAddCharacterOpen(false);
                  setSelectedCharacterId(null);
                  setSearchCharacterModal('');
                }}
                className="p-1 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Busca de personagem */}
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Buscar Personagem</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchCharacterModal}
                    onChange={(e) => setSearchCharacterModal(e.target.value)}
                    placeholder="Digite o nome do personagem..."
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Lista de personagens */}
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Selecione um Personagem</label>
                <div className="max-h-64 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded-lg">
                  {filteredCharactersModal.length === 0 ? (
                    <p className="px-4 py-6 text-zinc-500 text-center">
                      {searchCharacterModal ? 'Nenhum personagem encontrado' : 'Todos os personagens já estão na organização'}
                    </p>
                  ) : (
                    filteredCharactersModal.map(char => (
                      <button
                        key={char._id}
                        onClick={() => setSelectedCharacterId(char._id)}
                        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-700 transition-colors text-left border-b border-zinc-700 last:border-b-0 ${
                          selectedCharacterId === char._id ? 'bg-zinc-700' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Users size={18} className="text-primary" />
                          <span className="text-white font-medium">{char.name}</span>
                          {char.private && (
                            <div className="flex items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded-full">
                              <EyeOff size={12} className="text-red-400" />
                              <span className="text-red-400 text-xs">Privado</span>
                            </div>
                          )}
                        </div>
                        {selectedCharacterId === char._id && (
                          <span className="text-primary text-xl">✓</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-zinc-700">
              <button 
                onClick={() => {
                  setAddCharacterOpen(false);
                  setSelectedCharacterId(null);
                  setSearchCharacterModal('');
                }}
                className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCharacter}
                disabled={saving || !selectedCharacterId}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Adicionar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
