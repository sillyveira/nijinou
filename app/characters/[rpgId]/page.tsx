'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  Loader2,
  X,
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  EyeOff,
  Crown,
} from 'lucide-react';

interface Character {
  _id: string;
  rpgId: string;
  ownerId: string;
  name: string;
  age: number;
  imageUrl: string;
  groupsAllowed: string[];
  private: boolean;
  organizationIds: string[];
}

interface Organization {
  _id: string;
  name: string;
  rpgId: string;
  private: boolean;
}

interface Group {
  _id: string;
  name: string;
}

export default function CharactersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;

  const [characters, setCharacters] = useState<Character[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [isRpgOwner, setIsRpgOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchName, setSearchName] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [filterAge, setFilterAge] = useState('');

  // Modal de criação
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newGroups, setNewGroups] = useState<string[]>([]);
  const [newPrivate, setNewPrivate] = useState(false);
  const [newOrgs, setNewOrgs] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Buscar personagens
  useEffect(() => {
    async function fetchCharacters() {
      try {
        const res = await fetch(`/api/characters?rpgId=${rpgId}`);
        const data = await res.json();
        if (data.characters) {
          setCharacters(data.characters);
          setFilteredCharacters(data.characters);
        }
        if (data.userId) setUserId(data.userId);
        if (data.isRpgOwner !== undefined) setIsRpgOwner(data.isRpgOwner);
      } catch (error) {
        console.error('Erro ao buscar personagens:', error);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated' && rpgId) {
      fetchCharacters();
    }
  }, [status, rpgId]);

  // Buscar organizações
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const res = await fetch(`/api/organizations?rpgId=${rpgId}`);
        const data = await res.json();
        if (data.organizations) {
          setOrganizations(data.organizations);
        }
      } catch (error) {
        console.error('Erro ao buscar organizações:', error);
      }
    }
    if (status === 'authenticated' && rpgId) {
      fetchOrganizations();
    }
  }, [status, rpgId]);

  // Buscar grupos
  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch('/api/groups');
        const data = await res.json();
        if (data.groups) {
          setAvailableGroups(data.groups);
        }
      } catch (error) {
        console.error('Erro ao buscar grupos:', error);
      }
    }
    if (createModalOpen) {
      fetchGroups();
    }
  }, [createModalOpen]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...characters];

    if (searchName.trim()) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (filterOrg) {
      filtered = filtered.filter((c) => c.organizationIds.includes(filterOrg));
    }

    if (filterAge.trim()) {
      const age = parseInt(filterAge);
      if (!isNaN(age)) {
        filtered = filtered.filter((c) => c.age === age);
      }
    }

    setFilteredCharacters(filtered);
  }, [searchName, filterOrg, filterAge, characters]);

  // Criar personagem
  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rpgId,
          name: newName,
          age: parseInt(newAge),
          imageUrl: newImageUrl,
          groupsAllowed: newGroups,
          privateChar: newPrivate,
          organizationIds: newOrgs,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCharacters([data.character, ...characters]);
        setCreateModalOpen(false);
        setNewName('');
        setNewAge('');
        setNewImageUrl('');
        setNewGroups([]);
        setNewPrivate(false);
        setNewOrgs([]);
      }
    } catch (error) {
      console.error('Erro ao criar personagem:', error);
    } finally {
      setCreating(false);
    }
  };

  const toggleGroupSelection = (id: string) => {
    if (newGroups.includes(id)) {
      setNewGroups(newGroups.filter((g) => g !== id));
    } else {
      setNewGroups([...newGroups, id]);
    }
  };

  const toggleOrgSelection = (id: string) => {
    if (newOrgs.includes(id)) {
      setNewOrgs(newOrgs.filter((o) => o !== id));
    } else {
      setNewOrgs([...newOrgs, id]);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <Users size={36} className="text-primary" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">Personagens</h1>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-all shadow-lg"
          >
            <Plus size={22} />
            Criar Personagem
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-zinc-400" />
            <h2 className="text-lg font-bold text-white">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Nome</label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Buscar por nome..."
                  className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Organização</label>
              <select
                value={filterOrg}
                onChange={(e) => setFilterOrg(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Todas</option>
                {organizations.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Idade</label>
              <input
                type="number"
                value={filterAge}
                onChange={(e) => setFilterAge(e.target.value)}
                placeholder="Filtrar por idade..."
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Grid de personagens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharacters.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <Users size={64} className="text-zinc-700 mb-4" />
              <p className="text-zinc-400 text-lg">Nenhum personagem encontrado</p>
            </div>
          ) : (
            filteredCharacters.map((character) => {
              const isOwner = character.ownerId === userId;
              return (
                <div
                  key={character._id}
                  onClick={() => router.push(`/characters/${rpgId}/${character._id}`)}
                  className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-primary/50 transition-all cursor-pointer group"
                >
                  {/* Imagem */}
                  <div className="relative h-48 bg-zinc-800">
                    {character.imageUrl ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform"
                        style={{ backgroundImage: `url(${character.imageUrl})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Users size={64} className="text-zinc-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
                    {/* Badges */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      {isOwner && (
                        <div className="px-2 py-1 bg-yellow-500/20 rounded-full">
                          <Crown size={14} className="text-yellow-400" />
                        </div>
                      )}
                      {character.private && (isOwner || isRpgOwner) && (
                        <div className="px-2 py-1 bg-zinc-800/80 rounded-full">
                          <EyeOff size={14} className="text-zinc-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">
                      {character.name}
                    </h3>
                    <p className="text-zinc-400 text-sm">Idade: {character.age}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal de criação */}
        {createModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-zinc-700">
                <h2 className="text-xl font-bold text-white">Criar Personagem</h2>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-2">Nome *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nome do personagem"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-2">Idade *</label>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    placeholder="Idade"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-2">URL da Imagem</label>
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-2">Grupos com acesso</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newGroups.map((id) => {
                      const group = availableGroups.find((g) => g._id === id);
                      return (
                        <span
                          key={id}
                          className="flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary-light rounded-full text-sm"
                        >
                          {group?.name}
                          <button
                            onClick={() => toggleGroupSelection(id)}
                            className="hover:text-white transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <div className="max-h-32 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded-lg">
                    {availableGroups.length === 0 ? (
                      <p className="px-4 py-3 text-zinc-500 text-center text-sm">
                        Nenhum grupo disponível
                      </p>
                    ) : (
                      availableGroups.map((group) => (
                        <button
                          key={group._id}
                          onClick={() => toggleGroupSelection(group._id)}
                          className="w-full flex items-center justify-between px-4 py-2 hover:bg-zinc-700 transition-colors text-left text-sm"
                        >
                          <span className="text-white">{group.name}</span>
                          {newGroups.includes(group._id) && (
                            <span className="text-primary">✓</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-2">Organizações</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newOrgs.map((id) => {
                      const org = organizations.find((o) => o._id === id);
                      return (
                        <span
                          key={id}
                          className="flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary-light rounded-full text-sm"
                        >
                          {org?.name}
                          <button
                            onClick={() => toggleOrgSelection(id)}
                            className="hover:text-white transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <div className="max-h-32 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded-lg">
                    {organizations.length === 0 ? (
                      <p className="px-4 py-3 text-zinc-500 text-center text-sm">
                        Nenhuma organização disponível
                      </p>
                    ) : (
                      organizations.map((org) => (
                        <button
                          key={org._id}
                          onClick={() => toggleOrgSelection(org._id)}
                          className="w-full flex items-center justify-between px-4 py-2 hover:bg-zinc-700 transition-colors text-left text-sm"
                        >
                          <span className="text-white">{org.name}</span>
                          {newOrgs.includes(org._id) && (
                            <span className="text-primary">✓</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="private"
                    checked={newPrivate}
                    onChange={(e) => setNewPrivate(e.target.checked)}
                    className="w-5 h-5 bg-zinc-800 border-zinc-600 rounded focus:ring-2 focus:ring-primary"
                  />
                  <label htmlFor="private" className="text-zinc-300 font-medium">
                    Personagem Privado
                  </label>
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t border-zinc-700">
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim() || !newAge.trim()}
                  className="flex-1 px-4 py-3 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Plus size={20} />
                  )}
                  Criar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
