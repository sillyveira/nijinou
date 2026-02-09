'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  Settings,
  Loader2,
  X,
  Crown,
  Gamepad2,
  Users,
  Landmark,
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
}

export default function RPGPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.id as string;

  const [rpg, setRpg] = useState<RPG | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal de configuração
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGroups, setEditGroups] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Buscar RPG
  useEffect(() => {
    async function fetchRPG() {
      try {
        const res = await fetch(`/api/rpgs?id=${rpgId}`);
        const data = await res.json();
        if (data.rpg) {
          setRpg(data.rpg);
          setEditName(data.rpg.name);
          setEditGroups(data.rpg.groupsAllowed);
        }
        if (data.userId) setUserId(data.userId);
      } catch (error) {
        console.error('Erro ao buscar RPG:', error);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated' && rpgId) {
      fetchRPG();
    }
  }, [status, rpgId]);

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
    if (configModalOpen) {
      fetchGroups();
    }
  }, [configModalOpen]);

  // Salvar configurações
  const handleSaveConfig = async () => {
    if (!rpg) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rpgs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rpgId: rpg._id,
          name: editName,
          groupsAllowed: editGroups,
        }),
      });
      if (res.ok) {
        setRpg({ ...rpg, name: editName, groupsAllowed: editGroups });
        setConfigModalOpen(false);
      }
    } catch (error) {
      console.error('Erro ao salvar config:', error);
    } finally {
      setSaving(false);
    }
  };

  // Toggle seleção de grupo
  const toggleGroupSelection = (id: string) => {
    if (editGroups.includes(id)) {
      setEditGroups(editGroups.filter((g) => g !== id));
    } else {
      setEditGroups([...editGroups, id]);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!rpg) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Gamepad2 size={48} className="text-zinc-700" />
        <span className="ml-4 text-zinc-400 text-lg">RPG não encontrado</span>
      </div>
    );
  }

  const isOwner = userId === rpg.ownerId;

  return (
    <div className="min-h-screen bg-secondary">
      {/* Banner com imagem */}
      <div className="relative h-64 w-full mb-8 rounded-b-xl overflow-hidden">
        {rpg.imageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${rpg.imageUrl})`,
              filter: 'blur(8px) brightness(0.5)',
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-t from-primary to-zinc-900" />
        )}
  <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-2xl mb-2">
            {rpg.name}
          </h1>
          {isOwner && (
            <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-1 rounded-full">
              <Crown size={18} className="text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">Dono</span>
            </div>
          )}
          {isOwner && (
            <button
              onClick={() => setConfigModalOpen(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors border border-zinc-700 shadow-lg"
            >
              <Settings size={20} />
              Configurações
            </button>
          )}
        </div>
      </div>

      {/* Botões de navegação vertical, centralizados, grandes no web, com imagem de fundo e gradiente */}
      <div className="flex flex-col items-center justify-center gap-6 mb-12">
        <button
          className="relative cursor-pointer flex items-center gap-3 px-6 py-5 md:px-10 md:py-8 text-white font-semibold rounded-xl transition-all shadow-xl w-60 md:min-w-105 md:max-w-2xl md:w-full h-20 md:h-32 overflow-hidden group"
          style={{
            backgroundImage:
              'linear-gradient(to right, #000 30%, transparent), url(https://preview.redd.it/i-tried-to-draw-karakuri-island-using-ai-v0-utgh62mg68j81.png?width=640&crop=smart&auto=webp&s=24ddf2d14e1d6e690592379e041eb5408fecf881)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          onClick={()=>{router.push(`/arcs/${rpg._id}`)}}
        >
          <span className="absolute inset-0 transition-all group-hover:bg-primary/30" />
          <Gamepad2 size={32} className="drop-shadow-lg z-10 group-hover:text-primary transition-all" />
          <span className="text-lg md:text-2xl font-bold drop-shadow-lg z-10 group-hover:text-primary transition-all">Arcos</span>
        </button>
        <button
          className="relative cursor-pointer flex items-center gap-3 px-6 py-5 md:px-10 md:py-8 text-white font-semibold rounded-xl transition-all shadow-xl w-60 md:min-w-105 md:max-w-2xl md:w-full h-20 md:h-32 overflow-hidden group"
          style={{
            backgroundImage:
              'linear-gradient(to right, #000 30%, transparent), url(https://www.nintendo.com/eu/media/images/10_share_images/games_15/nintendo_switch_download_software_1/2x1_NSwitchDS_MushokuTenseiJoblessReincarnationQuestOfMemories_image1600w.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          onClick={()=>{router.push(`/characters/${rpg._id}`)}}
        >
          <span className="absolute inset-0 transition-all group-hover:bg-primary/30" />
          <Users size={32} className="drop-shadow-lg z-10 group-hover:text-primary transition-all" />
          <span className="text-lg md:text-2xl font-bold drop-shadow-lg z-10 group-hover:text-primary transition-all">Personagens</span>
        </button>
        <button
          className="relative flex items-center gap-3 px-6 py-5 md:px-10 md:py-8 text-white font-semibold rounded-xl transition-all shadow-xl w-60 md:min-w-105 md:max-w-2xl md:w-full h-20 md:h-32 overflow-hidden group"
          style={{
            backgroundImage:
              'linear-gradient(to right, #000 30%, transparent), url(https://imgix.ranker.com/list_img_v2/1743/3121743/original/3121743)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <span className="absolute inset-0 transition-all group-hover:bg-primary/30" />
          <Landmark size={32} className="drop-shadow-lg z-10 group-hover:text-primary transition-all" />
          <span className="text-lg md:text-2xl font-bold drop-shadow-lg z-10 group-hover:text-primary transition-all">Organizações</span>
        </button>
      </div>

      {/* Modal de configuração */}
      {configModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-white">Configurações do RPG</h2>
              <button
                onClick={() => setConfigModalOpen(false)}
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
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Digite o nome do RPG"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Seletor de grupos */}
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Grupos com acesso</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editGroups.map((id) => {
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
                <div className="max-h-48 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl">
                  {availableGroups.length === 0 ? (
                    <p className="px-4 py-3 text-zinc-500 text-center">Nenhum grupo disponível</p>
                  ) : (
                    availableGroups.map((group) => (
                      <button
                        key={group._id}
                        onClick={() => toggleGroupSelection(group._id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-700 transition-colors text-left"
                      >
                        <span className="text-white">{group.name}</span>
                        {editGroups.includes(group._id) && (
                          <span className="text-primary">✓</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-zinc-700">
              <button
                onClick={() => setConfigModalOpen(false)}
                className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={saving || !editName.trim()}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Settings size={20} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
