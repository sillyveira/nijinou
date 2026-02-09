'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Search,
  Plus,
  Edit3,
  Trash2,
  EyeOff,
  Calendar,
  BookOpen,
  ArrowLeft,
  Users,
} from 'lucide-react';

interface HistoryItem {
  _id: string;
  rpgId: string;
  chapterName: string;
  content: string;
  ownerId: string;
  private: boolean;
  characterIds: string[];
  year?: number;
  imageUrl?: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
}

interface CharacterInfo {
  _id: string;
  name: string;
}

interface CharacterOption {
  _id: string;
  name: string;
}

interface Props {
  rpgId: string;
  parentId: string;
  parentType: 'character' | 'arc' | 'event';
  parentName: string;
  historyIds: string[];
  isRpgOwner: boolean;
  isParentOwner: boolean;
  backUrl: string;
  /** Base path for navigation, e.g. /characters/rpgId/charId/history */
  editorBasePath: string;
}

export default function HistoryPageBase({
  rpgId,
  parentId,
  parentType,
  parentName,
  historyIds,
  isRpgOwner,
  isParentOwner,
  backUrl,
  editorBasePath,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [characterCache, setCharacterCache] = useState<Record<string, CharacterInfo>>({});

  const [searchName, setSearchName] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [filterCharacterId, setFilterCharacterId] = useState('');
  const [availableCharacters, setAvailableCharacters] = useState<CharacterOption[]>([]);

  const [readingHistory, setReadingHistory] = useState<HistoryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const canDelete = isRpgOwner || isParentOwner;

  // Buscar histórias
  useEffect(() => {
    async function fetchHistories() {
      if (!historyIds.length) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/histories?rpgId=${rpgId}&ids=${historyIds.join(',')}`);
        const data = await res.json();
        if (data.histories) {
          setHistories(data.histories);
        }
      } catch (error) {
        console.error('Erro ao buscar histórias:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistories();
  }, [rpgId, historyIds]);

  // Buscar nomes dos personagens em batch
  useEffect(() => {
    async function fetchCharacterNames() {
      const allIds = new Set<string>();
      histories.forEach(h => h.characterIds?.forEach(id => allIds.add(id)));
      if (allIds.size === 0) return;

      const missingIds = [...allIds].filter(id => !characterCache[id]);
      if (missingIds.length === 0) return;

      try {
        const res = await fetch(`/api/characters?rpgId=${rpgId}`);
        const data = await res.json();
        if (data.characters) {
          const cache: Record<string, CharacterInfo> = { ...characterCache };
          data.characters.forEach((c: any) => {
            cache[c._id] = { _id: c._id, name: c.name };
          });
          setCharacterCache(cache);
        }
      } catch (error) {
        console.error('Erro ao buscar personagens:', error);
      }
    }
    if (histories.length > 0) fetchCharacterNames();
  }, [histories, rpgId]);

  // Buscar personagens para filtro
  useEffect(() => {
    async function fetchChars() {
      try {
        const res = await fetch(`/api/characters?rpgId=${rpgId}`);
        const data = await res.json();
        if (data.characters) {
          setAvailableCharacters(data.characters.map((c: any) => ({ _id: c._id, name: c.name })));
        }
      } catch (error) {
        console.error('Erro ao buscar personagens para filtro:', error);
      }
    }
    fetchChars();
  }, [rpgId]);

  const filteredHistories = useMemo(() => {
    return histories.filter(h => {
      if (searchName && !h.chapterName.toLowerCase().includes(searchName.toLowerCase())) return false;
      if (yearFrom && h.year !== undefined && h.year < parseInt(yearFrom)) return false;
      if (yearTo && h.year !== undefined && h.year > parseInt(yearTo)) return false;
      if ((yearFrom || yearTo) && h.year === undefined) return false;
      if (filterCharacterId && !h.characterIds?.includes(filterCharacterId)) return false;
      return true;
    });
  }, [histories, searchName, yearFrom, yearTo, filterCharacterId]);

  const handleDelete = async (historyId: string) => {
    try {
      const res = await fetch('/api/histories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId, parentId, parentType }),
      });
      if (res.ok) {
        setHistories(prev => prev.filter(h => h._id !== historyId));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Erro ao deletar história:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  // Modo leitura
  if (readingHistory) {
    return (
      <div className="min-h-screen bg-secondary">
        <div className="relative h-64 w-full mb-8 rounded-b-xl overflow-hidden">
          {readingHistory.imageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${readingHistory.imageUrl})`,
                filter: 'blur(8px) brightness(0.5)',
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-t from-primary to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-2xl mb-2 text-center px-4">
              {readingHistory.chapterName}
            </h1>
            {readingHistory.year && (
              <p className="text-lg text-zinc-300 drop-shadow-lg mb-3 flex items-center gap-2">
                <Calendar size={18} />
                Ano {readingHistory.year}
              </p>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pb-12">
          <button
            onClick={() => setReadingHistory(null)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar aos capítulos
          </button>

          {readingHistory.characterIds?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {readingHistory.characterIds.map(id => (
                <span key={id} className="px-3 py-1 bg-primary/20 text-primary-light rounded-full text-sm flex items-center gap-1">
                  <Users size={14} />
                  {characterCache[id]?.name || 'Personagem'}
                </span>
              ))}
            </div>
          )}

          <div
            className="ql-editor-view text-white text-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: readingHistory.content }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <div className="relative h-48 w-full mb-8 rounded-b-xl overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-primary/40 to-zinc-900" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <BookOpen size={40} className="text-primary mb-2" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-2xl mb-1">
            Histórias
          </h1>
          <p className="text-white text-sm">{parentName}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(backUrl)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <button
            onClick={() => router.push(`${editorBasePath}/editor`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Plus size={20} />
            Adicionar Capítulo
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Buscar por nome..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="number"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                placeholder="Ano de..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="number"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                placeholder="Ano até..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
            <select
              value={filterCharacterId}
              onChange={(e) => setFilterCharacterId(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="">Todos os personagens</option>
              {availableCharacters.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid de cards */}
        {filteredHistories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen size={64} className="text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-lg">Nenhum capítulo encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHistories.map((h) => (
              <div
                key={h._id}
                className="relative group rounded-xl overflow-hidden border border-zinc-800 hover:border-primary/40 transition-all shadow-lg cursor-pointer h-56"
                onClick={() => setReadingHistory(h)}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${h.imageUrl || 'https://i.pinimg.com/originals/e5/1f/2f/e51f2f9a59dfd8e4e3012e144e2f19eb.gif'})`,
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-transparent" />

                <div className="relative z-10 flex flex-col justify-end h-full p-4">
                  {h.private && (
                    <div className="absolute top-3 right-3 bg-zinc-800/80 p-1.5 rounded-full">
                      <EyeOff size={14} className="text-zinc-400" />
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-white drop-shadow-lg mb-1 line-clamp-2">
                    {h.chapterName}
                  </h3>
                  {h.year !== undefined && (
                    <p className="text-sm text-white flex items-center gap-1 mb-2">
                      <Calendar size={14} />
                      Ano {h.year}
                    </p>
                  )}

                  {h.characterIds?.length > 0 && (
                    <div className="flex gap-1.5 overflow-hidden max-h-7">
                      {h.characterIds.map(id => (
                        <span
                          key={id}
                          className="px-2 py-0.5 bg-primary/20 text-primary-light rounded-full text-xs whitespace-nowrap"
                        >
                          {characterCache[id]?.name || '...'}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`${editorBasePath}/editor?id=${h._id}`)}
                      className="p-1.5 bg-zinc-700/80 hover:bg-zinc-600 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit3 size={16} className="text-zinc-300" />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => setDeleteConfirm(h._id)}
                        className="p-1.5 bg-red-900/60 hover:bg-red-800/80 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm shadow-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">Confirmar exclusão</h2>
            <p className="text-white mb-6">Tem certeza de que deseja excluir este capítulo? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
