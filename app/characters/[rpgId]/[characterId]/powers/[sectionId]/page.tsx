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
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface PowerSection {
  _id: string;
  name: string;
  imageUrl: string;
  private: boolean;
  ownerId: string;
}

interface Power {
  _id: string;
  sectionId: string;
  ownerId: string;
  name: string;
  imageUrl: string;
  content: string;
  powerType: 'skill' | 'transformation';
  private: boolean;
  createdAt: string;
}

export default function SectionDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;
  const characterId = params?.characterId as string;
  const sectionId = params?.sectionId as string;

  const [section, setSection] = useState<PowerSection | null>(null);
  const [powers, setPowers] = useState<Power[]>([]);
  const [isRpgOwner, setIsRpgOwner] = useState(false);
  const [isCharOwner, setIsCharOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'skill' | 'transformation'>('skill');
  const [searchName, setSearchName] = useState('');

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newPowerType, setNewPowerType] = useState<'skill' | 'transformation'>('skill');
  const [newPrivate, setNewPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingPower, setEditingPower] = useState<Power | null>(null);
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
      if (!sectionId) return;
      try {
        const res = await fetch(`/api/powers?sectionId=${sectionId}`);
        const data = await res.json();
        if (data.section) setSection(data.section);
        if (data.powers) setPowers(data.powers);
        if (data.isRpgOwner !== undefined) setIsRpgOwner(data.isRpgOwner);
        if (data.isCharOwner !== undefined) setIsCharOwner(data.isCharOwner);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchData();
  }, [status, sectionId]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/powers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rpgId,
          characterId,
          sectionId,
          name: newName,
          imageUrl: newImageUrl,
          powerType: newPowerType,
          private: newPrivate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPowers(prev => [data.power, ...prev]);
        setCreateOpen(false);
        setNewName('');
        setNewImageUrl('');
        setNewPrivate(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao criar poder');
      }
    } catch (error) {
      console.error('Erro ao criar poder:', error);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (power: Power) => {
    setEditingPower(power);
    setEditName(power.name);
    setEditImageUrl(power.imageUrl);
    setEditPrivate(power.private);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingPower || !editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/powers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          powerId: editingPower._id,
          name: editName,
          imageUrl: editImageUrl,
          private: editPrivate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPowers(prev => prev.map(p => p._id === data.power._id ? data.power : p));
        setEditOpen(false);
        setEditingPower(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao editar poder');
      }
    } catch (error) {
      console.error('Erro ao editar poder:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (powerId: string) => {
    try {
      const res = await fetch('/api/powers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ powerId }),
      });
      if (res.ok) {
        setPowers(prev => prev.filter(p => p._id !== powerId));
        setDeleteConfirm(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao deletar poder');
      }
    } catch (error) {
      console.error('Erro ao deletar poder:', error);
    }
  };

  const filteredPowers = powers
    .filter(p => p.powerType === activeTab)
    .filter(p => p.name.toLowerCase().includes(searchName.toLowerCase()));

  const tabs = [
    { key: 'skill' as const, label: 'Habilidades', icon: Sparkles },
    { key: 'transformation' as const, label: 'Transformações', icon: RefreshCw },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Banner */}
      {section && (
        <div className="relative h-48 w-full mb-6 overflow-hidden">
          {section.imageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${section.imageUrl})`,
                filter: 'blur(4px) brightness(0.4)',
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-t from-primary/30 to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <Zap size={36} className="text-primary mb-2" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-2xl">
              {section.name}
            </h1>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Header actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(`/characters/${rpgId}/${characterId}/powers`)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar aos Poderes
          </button>
          {canEdit && (
            <button
              onClick={() => {
                setNewPowerType(activeTab);
                setCreateOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              <Plus size={20} />
              Novo Poder
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl mb-6 border border-zinc-800">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const count = powers.filter(p => p.powerType === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all text-sm ${
                  isActive
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Icon size={18} />
                {tab.label}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20' : 'bg-zinc-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Buscar poder..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Powers grid */}
        {filteredPowers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            {activeTab === 'skill' ? (
              <Sparkles size={64} className="text-zinc-700 mb-4" />
            ) : (
              <RefreshCw size={64} className="text-zinc-700 mb-4" />
            )}
            <p className="text-zinc-500 text-lg">
              Nenhum(a) {activeTab === 'skill' ? 'habilidade' : 'transformação'} encontrada
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPowers.map(power => {
              const isOwner = power.ownerId === userId;

              return (
                <div
                  key={power._id}
                  className="relative group bg-zinc-900 border border-zinc-800 hover:border-primary/40 rounded-xl overflow-hidden cursor-pointer transition-all shadow-lg"
                  onClick={() => router.push(`/characters/${rpgId}/${characterId}/powers/${sectionId}/${power._id}`)}
                >
                  {/* Image */}
                  {power.imageUrl ? (
                    <img src={power.imageUrl} alt={power.name} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      {activeTab === 'skill' ? (
                        <Sparkles size={48} className="text-zinc-700" />
                      ) : (
                        <RefreshCw size={48} className="text-zinc-700" />
                      )}
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">{power.name}</h3>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1">
                    {power.private && (
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
                        onClick={(e) => { e.stopPropagation(); openEdit(power); }}
                        className="p-1.5 bg-blue-900/60 hover:bg-blue-800/80 backdrop-blur-sm rounded-lg transition-colors"
                      >
                        <Pencil size={16} className="text-blue-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(power._id); }}
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
              <h2 className="text-xl font-bold text-white">Novo Poder</h2>
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
                  placeholder="Nome do poder..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Tipo</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewPowerType('skill')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${
                      newPowerType === 'skill'
                        ? 'bg-primary text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    <Sparkles size={16} />
                    Habilidade
                  </button>
                  <button
                    onClick={() => setNewPowerType('transformation')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${
                      newPowerType === 'transformation'
                        ? 'bg-primary text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    <RefreshCw size={16} />
                    Transformação
                  </button>
                </div>
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
      {editOpen && editingPower && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-white">Editar Poder</h2>
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
                  placeholder="Nome do poder..."
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
            <p className="text-zinc-400 mb-6">Tem certeza que deseja excluir este poder?</p>
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
