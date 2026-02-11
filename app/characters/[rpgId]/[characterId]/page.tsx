'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  Settings,
  Loader2,
  X,
  Crown,
  Users,
  BookOpen,
  FileText,
  Package,
  Zap,
  EyeOff,
  Eye,
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

interface Group {
  _id: string;
  name: string;
}

export default function CharacterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;
  const characterId = params?.characterId as string;

  const [character, setCharacter] = useState<Character | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [isRpgOwner, setIsRpgOwner] = useState(false);
  const [isCharacterOwner, setIsCharacterOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal de configuração
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editGroups, setEditGroups] = useState<string[]>([]);
  const [editPrivate, setEditPrivate] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Buscar personagem
  useEffect(() => {
    async function fetchCharacter() {
      try {
        const res = await fetch(`/api/characters?rpgId=${rpgId}&id=${characterId}`);
        const data = await res.json();
        if (data.character) {
          setCharacter(data.character);
          setEditName(data.character.name);
          setEditAge(data.character.age.toString());
          setEditImageUrl(data.character.imageUrl);
          setEditGroups(data.character.groupsAllowed);
          setEditPrivate(data.character.private);
        }
        if (data.userId) setUserId(data.userId);
        if (data.isRpgOwner !== undefined) setIsRpgOwner(data.isRpgOwner);
        if (data.isCharacterOwner !== undefined) setIsCharacterOwner(data.isCharacterOwner);
      } catch (error) {
        console.error('Erro ao buscar personagem:', error);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated' && rpgId && characterId) {
      fetchCharacter();
    }
  }, [status, rpgId, characterId]);

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
    if (!character) return;
    setSaving(true);
    try {
      const res = await fetch('/api/characters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character._id,
          name: editName,
          age: parseInt(editAge),
          imageUrl: editImageUrl,
          groupsAllowed: editGroups,
          privateChar: editPrivate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCharacter(data.character);
        setConfigModalOpen(false);
      }
    } catch (error) {
      console.error('Erro ao salvar config:', error);
    } finally {
      setSaving(false);
    }
  };

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

  if (!character) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Users size={48} className="text-zinc-700" />
        <span className="ml-4 text-zinc-400 text-lg">Personagem não encontrado</span>
      </div>
    );
  }

  const canEdit = isRpgOwner || isCharacterOwner;

  return (
    <div className="min-h-screen bg-secondary">
      {/* Banner com foto e informações */}
      <div className="relative h-96 w-full mb-8 rounded-b-xl overflow-hidden">
        {character.imageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${character.imageUrl})`,
              filter: 'blur(8px) brightness(0.5)',
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-t from-primary to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          {/* Foto do personagem */}
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl mb-4">
            {character.imageUrl ? (
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${character.imageUrl})` }}
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <Users size={64} className="text-zinc-600" />
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-2xl mb-2">
            {character.name}
          </h1>
          <p className="text-xl text-zinc-300 drop-shadow-lg mb-3">
            {character.age} anos
          </p>

          {/* Badges */}
          <div className="flex gap-3 mb-4">
            {character.private && canEdit && (
              <div className="flex items-center gap-2 bg-zinc-800/60 px-4 py-1 rounded-full">
                <EyeOff size={18} className="text-zinc-300" />
                <span className="text-zinc-300 text-sm font-medium">Privado</span>
              </div>
            )}
          </div>

          {canEdit && (
            <button
              onClick={() => setConfigModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors border border-zinc-700 shadow-lg"
            >
              <Settings size={20} />
              Configurações
            </button>
          )}
        </div>
      </div>

      {/* Botões de navegação vertical */}
      <div className="flex flex-col items-center justify-center gap-6 mb-12">
        <button
          onClick={() => router.push(`/characters/${rpgId}/${characterId}/history`)}
          className="relative flex items-center gap-3 px-6 py-5 md:px-10 md:py-8 text-white font-semibold rounded-xl transition-all shadow-xl w-60 md:min-w-105 md:max-w-2xl md:w-full h-20 md:h-32 overflow-hidden group"
          style={{
            backgroundImage:
              'linear-gradient(to right, #000 30%, transparent), url(https://i.pinimg.com/originals/e1/a9/64/e1a964511213dac71f775a348774fcfc.gif)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <span className="absolute inset-0 transition-all group-hover:bg-primary/30" />
          <BookOpen size={32} className="drop-shadow-lg z-10 group-hover:text-primary transition-all" />
          <span className="text-lg md:text-2xl font-bold drop-shadow-lg z-10 group-hover:text-primary transition-all">
            História
          </span>
        </button>
        <button
          onClick={() => router.push(`/characters/${rpgId}/${characterId}/sheet`)}
          className="relative flex items-center gap-3 px-6 py-5 md:px-10 md:py-8 text-white font-semibold rounded-xl transition-all shadow-xl w-60 md:min-w-105 md:max-w-2xl md:w-full h-20 md:h-32 overflow-hidden group"
          style={{
            backgroundImage:
              'linear-gradient(to right, #000 30%, transparent), url(https://i.pinimg.com/736x/30/05/2e/30052e9d9e8f15ef76140a57fb902b7e.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <span className="absolute inset-0 transition-all group-hover:bg-primary/30" />
          <FileText size={32} className="drop-shadow-lg z-10 group-hover:text-primary transition-all" />
          <span className="text-lg md:text-2xl font-bold drop-shadow-lg z-10 group-hover:text-primary transition-all">
            Ficha
          </span>
        </button>
        <button
          className="relative flex items-center gap-3 px-6 py-5 md:px-10 md:py-8 text-white font-semibold rounded-xl transition-all shadow-xl w-60 md:min-w-105 md:max-w-2xl md:w-full h-20 md:h-32 overflow-hidden group"
          style={{
            backgroundImage:
              'linear-gradient(to right, #000 30%, transparent), url(https://i.ytimg.com/vi/weGTh_0l3HQ/maxresdefault.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <span className="absolute inset-0 transition-all group-hover:bg-primary/30" />
          <Package size={32} className="drop-shadow-lg z-10 group-hover:text-primary transition-all" />
          <span className="text-lg md:text-2xl font-bold drop-shadow-lg z-10 group-hover:text-primary transition-all">
            Inventário
          </span>
        </button>
        <button
          onClick={() => router.push(`/characters/${rpgId}/${characterId}/powers`)}
          className="relative flex items-center gap-3 px-6 py-5 md:px-10 md:py-8 text-white font-semibold rounded-xl transition-all shadow-xl w-60 md:min-w-105 md:max-w-2xl md:w-full h-20 md:h-32 overflow-hidden group"
          style={{
            backgroundImage:
              'linear-gradient(to right, #000 30%, transparent), url(https://i.makeagif.com/media/4-17-2021/-SCvTZ.gif)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <span className="absolute inset-0 transition-all group-hover:bg-primary/30" />
          <Zap size={32} className="drop-shadow-lg z-10 group-hover:text-primary transition-all" />
          <span className="text-lg md:text-2xl font-bold drop-shadow-lg z-10 group-hover:text-primary transition-all">
            Poderes
          </span>
        </button>
      </div>

      {/* Modal de configuração */}
      {configModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-white">Configurações do Personagem</h2>
              <button
                onClick={() => setConfigModalOpen(false)}
                className="p-1 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Nome */}
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Nome</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome do personagem"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Idade */}
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Idade</label>
                <input
                  type="number"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  placeholder="Idade"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* URL da Imagem */}
              <div>
                <label className="block text-zinc-300 font-medium mb-2">URL da Imagem</label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Grupos com acesso */}
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

              {/* Privado */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="private-edit"
                  checked={editPrivate}
                  onChange={(e) => setEditPrivate(e.target.checked)}
                  className="w-5 h-5 bg-zinc-800 border-zinc-600 rounded focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="private-edit" className="text-zinc-300 font-medium flex items-center gap-2">
                  {editPrivate ? <EyeOff size={18} /> : <Eye size={18} />}
                  Personagem Privado
                </label>
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
                disabled={saving || !editName.trim() || !editAge.trim()}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
