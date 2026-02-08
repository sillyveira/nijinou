'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Loader2,
  X,
  Gamepad2,
  ChevronDown,
  Check,
  Crown,
} from 'lucide-react';

interface RPG {
  _id: string;
  name: string;
  ownerId: string;
  imageUrl: string;
  groupsAllowed: string[];
}

interface Group {
  _id: string;
  name: string;
  ownerId: string;
}

export default function RPGsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [rpgs, setRpgs] = useState<RPG[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal de criar RPG
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRpgName, setNewRpgName] = useState('');
  const [newRpgImage, setNewRpgImage] = useState('');
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const groupDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Buscar RPGs
  useEffect(() => {
    async function fetchRPGs() {
      try {
        const res = await fetch('/api/rpgs');
        const data = await res.json();
        if (data.rpgs) {
          setRpgs(data.rpgs);
          setUserId(data.userId);
        }
      } catch (error) {
        console.error('Erro ao buscar RPGs:', error);
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchRPGs();
    }
  }, [status]);

  // Buscar grupos disponíveis
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

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
        setGroupDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Criar RPG
  const handleCreateRPG = async () => {
    if (!newRpgName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/rpgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRpgName,
          imageUrl: newRpgImage,
          groupsAllowed: selectedGroups,
        }),
      });

      const data = await res.json();
      if (data.rpg) {
        setRpgs([data.rpg, ...rpgs]);
        setCreateModalOpen(false);
        setNewRpgName('');
        setNewRpgImage('');
        setSelectedGroups([]);
      }
    } catch (error) {
      console.error('Erro ao criar RPG:', error);
    } finally {
      setCreating(false);
    }
  };

  // Toggle seleção de grupo
  const toggleGroupSelection = (id: string) => {
    if (selectedGroups.includes(id)) {
      setSelectedGroups(selectedGroups.filter((g) => g !== id));
    } else {
      setSelectedGroups([...selectedGroups, id]);
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
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Meus RPGs</h1>
            <p className="text-zinc-400">
              RPGs que você criou ou faz parte através de grupos
            </p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Plus size={20} />
            Novo RPG
          </button>
        </div>

        {/* Grid de RPGs */}
        {rpgs.length === 0 ? (
          <div className="text-center py-16">
            <Gamepad2 size={64} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400 text-lg">Nenhum RPG encontrado.</p>
            <p className="text-zinc-500 mt-2">Crie um novo RPG para começar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rpgs.map((rpg) => (
              <div
                key={rpg._id}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl"
                onClick={()=>{router.push(`/rpgs/${rpg._id}`)}}
              >
                {/* Background com imagem */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: rpg.imageUrl
                      ? `url(${rpg.imageUrl})`
                      : 'linear-gradient(135deg, #b8001c 0%, #2a0006 100%)',
                    filter: rpg.imageUrl ? 'brightness(0.5)' : 'none',
                  }}
                />

                {/* Gradiente preto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                {/* Conteúdo */}
                <div className="relative h-full flex flex-col justify-end p-6">
                  {/* Badge de dono */}
                  {rpg.ownerId === userId && (
                    <div className="absolute top-4 right-4 bg-yellow-500/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                      <Crown size={14} className="text-yellow-400" />
                      <span className="text-yellow-400 text-xs font-medium">Dono</span>
                    </div>
                  )}

                  {/* Título */}
                  <h3 className="text-white text-2xl font-bold drop-shadow-lg line-clamp-2">
                    {rpg.name}
                  </h3>

                  {/* Info de grupos */}
                  {rpg.groupsAllowed.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-zinc-300 text-sm">
                      <span className="opacity-75">{rpg.groupsAllowed.length} grupo(s)</span>
                    </div>
                  )}
                </div>

                {/* Overlay de hover */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de criar RPG */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-white">Criar Novo RPG</h2>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setNewRpgName('');
                  setNewRpgImage('');
                  setSelectedGroups([]);
                }}
                className="p-1 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Nome do RPG */}
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Nome do RPG</label>
                <input
                  type="text"
                  value={newRpgName}
                  onChange={(e) => setNewRpgName(e.target.value)}
                  placeholder="Digite o nome do RPG"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* URL da imagem */}
              <div>
                <label className="block text-zinc-300 font-medium mb-2">
                  URL da Imagem (opcional)
                </label>
                <input
                  type="url"
                  value={newRpgImage}
                  onChange={(e) => setNewRpgImage(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Seletor de grupos */}
              <div ref={groupDropdownRef}>
                <label className="block text-zinc-300 font-medium mb-2">
                  Grupos com acesso
                </label>
                <button
                  onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white hover:bg-zinc-700 transition-colors"
                >
                  <span className="text-zinc-400">
                    {selectedGroups.length > 0
                      ? `${selectedGroups.length} grupo(s) selecionado(s)`
                      : 'Selecionar grupos'}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-zinc-400 transition-transform ${
                      groupDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {groupDropdownOpen && (
                  <div className="mt-2 max-h-48 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl">
                    {availableGroups.length === 0 ? (
                      <p className="px-4 py-3 text-zinc-500 text-center">
                        Nenhum grupo disponível
                      </p>
                    ) : (
                      availableGroups.map((group) => (
                        <button
                          key={group._id}
                          onClick={() => toggleGroupSelection(group._id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-700 transition-colors text-left"
                        >
                          <span className="text-white">{group.name}</span>
                          {selectedGroups.includes(group._id) && (
                            <Check size={18} className="text-primary" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Grupos selecionados */}
              {selectedGroups.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedGroups.map((id) => {
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
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-zinc-700">
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setNewRpgName('');
                  setNewRpgImage('');
                  setSelectedGroups([]);
                }}
                className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRPG}
                disabled={!newRpgName.trim() || creating}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
  );
}
