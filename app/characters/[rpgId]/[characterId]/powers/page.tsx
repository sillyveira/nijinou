'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  Plus,
  X,
  Search,
  Trash2,
  Pencil,
  Zap,
  EyeOff,
  Crown,
} from 'lucide-react';

interface PowerSection {
  _id: string;
  rpgId: string;
  characterId: string;
  ownerId: string;
  name: string;
  imageUrl: string;
  private: boolean;
  createdAt: string;
}

interface Character {
  _id: string;
  name: string;
  ownerId: string;
}

export default function PowerSectionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;
  const characterId = params?.characterId as string;

  const [sections, setSections] = useState<PowerSection[]>([]);
  const [character, setCharacter] = useState<Character | null>(null);
  const [isRpgOwner, setIsRpgOwner] = useState(false);
  const [isCharOwner, setIsCharOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newPrivate, setNewPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<PowerSection | null>(null);
  const [editName, setEditName] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editPrivate, setEditPrivate] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const userId = session?.user?.id;
  const canEdit = isRpgOwner || isCharOwner;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      if (!rpgId || !characterId) return;
      try {
        // Fetch character info
        const charRes = await fetch(`/api/characters?rpgId=${rpgId}&id=${characterId}`);
        const charData = await charRes.json();
        if (charData.character) setCharacter(charData.character);

        // Fetch sections
        const secRes = await fetch(`/api/power-sections?rpgId=${rpgId}&characterId=${characterId}`);
        const secData = await secRes.json();
        if (secData.sections) setSections(secData.sections);
        if (secData.isRpgOwner !== undefined) setIsRpgOwner(secData.isRpgOwner);
        if (secData.isCharOwner !== undefined) setIsCharOwner(secData.isCharOwner);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchData();
  }, [status, rpgId, characterId]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/power-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rpgId,
          characterId,
          name: newName,
          imageUrl: newImageUrl,
          private: newPrivate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSections(prev => [data.section, ...prev]);
        setCreateOpen(false);
        setNewName('');
        setNewImageUrl('');
        setNewPrivate(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao criar seção');
      }
    } catch (error) {
      console.error('Erro ao criar seção:', error);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (section: PowerSection) => {
    setEditingSection(section);
    setEditName(section.name);
    setEditImageUrl(section.imageUrl);
    setEditPrivate(section.private);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingSection || !editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/power-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: editingSection._id,
          name: editName,
          imageUrl: editImageUrl,
          private: editPrivate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSections(prev => prev.map(s => s._id === data.section._id ? data.section : s));
        setEditOpen(false);
        setEditingSection(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao editar seção');
      }
    } catch (error) {
      console.error('Erro ao editar seção:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sectionId: string) => {
    try {
      const res = await fetch('/api/power-sections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId }),
      });
      if (res.ok) {
        setSections(prev => prev.filter(s => s._id !== sectionId));
        setDeleteConfirm(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao deletar seção');
      }
    } catch (error) {
      console.error('Erro ao deletar seção:', error);
    }
  };

  const filteredSections = sections.filter(s =>
    s.name.toLowerCase().includes(searchName.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(`/characters/${rpgId}/${characterId}`)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar ao Personagem
          </button>
          {canEdit && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              <Plus size={20} />
              Nova Seção
            </button>
          )}
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <Zap size={32} className="text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-white">Poderes</h1>
            {character && <p className="text-zinc-400">{character.name}</p>}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Buscar seção..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Sections grid */}
        {filteredSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Zap size={64} className="text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-lg">Nenhuma seção de poderes encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSections.map((section) => {
              const isOwner = section.ownerId === userId;

              return (
                <div
                  key={section._id}
                  className="relative group bg-zinc-900 border border-zinc-800 hover:border-primary/40 rounded-xl overflow-hidden cursor-pointer transition-all shadow-lg"
                  onClick={() => router.push(`/characters/${rpgId}/${characterId}/powers/${section._id}`)}
                >
                  {/* Image */}
                  {section.imageUrl ? (
                    <img src={section.imageUrl} alt={section.name} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      <Zap size={48} className="text-zinc-700" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">{section.name}</h3>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1">
                    {section.private && (
                      <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded-full">
                        <EyeOff size={12} className="text-red-400" />
                        <span className="text-red-400 text-xs">Privado</span>
                      </div>
                    )}
                    {isOwner && (
                      <div className="flex items-center gap-1 bg-yellow-500/20 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Crown size={12} className="text-yellow-400" />
                        <span className="text-yellow-400 text-xs">Dono</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {canEdit && (
                    <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(section); }}
                        className="p-1.5 bg-blue-900/60 hover:bg-blue-800/80 backdrop-blur-sm rounded-lg transition-colors"
                      >
                        <Pencil size={16} className="text-blue-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(section._id); }}
                        className="p-1.5 bg-red-900/60 hover:bg-red-800/80 backdrop-blur-sm rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de criação */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-white">Nova Seção de Poderes</h2>
              <button onClick={() => setCreateOpen(false)} className="p-1 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white">
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
                  placeholder="Nome da seção..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-2">URL da Imagem (opcional)</label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newPrivate} onChange={(e) => setNewPrivate(e.target.checked)} className="w-4 h-4 accent-primary" />
                  <span className="text-zinc-300 font-medium">Privado</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-zinc-700">
              <button onClick={() => setCreateOpen(false)} className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={handleCreate}
                disabled={saving || !newName.trim()}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {editOpen && editingSection && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-white">Editar Seção</h2>
              <button onClick={() => setEditOpen(false)} className="p-1 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Nome *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome da seção..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-2">URL da Imagem (opcional)</label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editPrivate} onChange={(e) => setEditPrivate(e.target.checked)} className="w-4 h-4 accent-primary" />
                  <span className="text-zinc-300 font-medium">Privado</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-zinc-700">
              <button onClick={() => setEditOpen(false)} className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={handleEdit}
                disabled={saving || !editName.trim()}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Pencil size={20} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm shadow-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">Confirmar exclusão</h2>
            <p className="text-zinc-400 mb-6">Tem certeza? Todos os poderes dentro desta seção serão excluídos.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
