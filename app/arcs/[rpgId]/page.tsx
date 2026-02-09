'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  Loader2,
  X,
  Plus,
  Gamepad2,
  ArrowLeft,
  Crown,
  Search,
  Trash2,
} from 'lucide-react';

interface Arc {
  _id: string;
  rpgId: string;
  name: string;
  ownerId: string;
  groupsAllowed: string[];
  historyIds: string[];
  createdAt: string;
}

interface Group {
  _id: string;
  name: string;
}

export default function ArcsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;

  const [arcs, setArcs] = useState<Arc[]>([]);
  const [userId, setUserId] = useState('');
  const [isRpgOwner, setIsRpgOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');

  // Modal de criação
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroups, setNewGroups] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchArcs() {
      try {
        const res = await fetch(`/api/arcs?rpgId=${rpgId}`);
        const data = await res.json();
        if (data.arcs) setArcs(data.arcs);
        if (data.userId) setUserId(data.userId);
        if (data.isRpgOwner !== undefined) setIsRpgOwner(data.isRpgOwner);
      } catch (error) {
        console.error('Erro ao buscar arcos:', error);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated' && rpgId) fetchArcs();
  }, [status, rpgId]);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch('/api/groups');
        const data = await res.json();
        if (data.groups) setAvailableGroups(data.groups);
      } catch (error) {
        console.error('Erro ao buscar grupos:', error);
      }
    }
    if (createOpen) fetchGroups();
  }, [createOpen]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/arcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpgId, name: newName, groupsAllowed: newGroups }),
      });
      if (res.ok) {
        const data = await res.json();
        setArcs(prev => [data.arc, ...prev]);
        setCreateOpen(false);
        setNewName('');
        setNewGroups([]);
      }
    } catch (error) {
      console.error('Erro ao criar arco:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (arcId: string) => {
    try {
      const res = await fetch('/api/arcs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arcId }),
      });
      if (res.ok) {
        setArcs(prev => prev.filter(a => a._id !== arcId));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Erro ao deletar arco:', error);
    }
  };

  const toggleGroup = (id: string) => {
    if (newGroups.includes(id)) {
      setNewGroups(newGroups.filter(g => g !== id));
    } else {
      setNewGroups([...newGroups, id]);
    }
  };

  const filteredArcs = arcs.filter(a =>
    a.name.toLowerCase().includes(searchName.toLowerCase())
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
      {/* Header */}
      <div className="relative h-48 w-full mb-8 rounded-b-xl overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-primary/40 to-zinc-900" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <Gamepad2 size={40} className="text-primary mb-2" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-2xl">
            Arcos
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Voltar + Adicionar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(`/rpgs/${rpgId}`)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Plus size={20} />
            Novo Arco
          </button>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Buscar arco..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Lista de arcos */}
        {filteredArcs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Gamepad2 size={64} className="text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-lg">Nenhum arco encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredArcs.map((arc) => (
              <div
                key={arc._id}
                className="relative group bg-zinc-900 border border-zinc-800 hover:border-primary/40 rounded-xl p-5 cursor-pointer transition-all shadow-lg"
                onClick={() => router.push(`/arcs/${rpgId}/${arc._id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Gamepad2 size={24} className="text-primary" />
                  <h3 className="text-lg font-bold text-white">{arc.name}</h3>
                </div>
                <p className="text-sm text-zinc-500">{arc.historyIds.length} capítulo(s)</p>
                {arc.ownerId === userId && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-500/20 px-2 py-0.5 rounded-full">
                    <Crown size={12} className="text-yellow-400" />
                    <span className="text-yellow-400 text-xs">Dono</span>
                  </div>
                )}

                {/* Delete button */}
                {(isRpgOwner || arc.ownerId === userId) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(arc._id); }}
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

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm shadow-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">Confirmar exclusão</h2>
            <p className="text-zinc-400 mb-6">Tem certeza de que deseja excluir este arco?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de criação */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-white">Novo Arco</h2>
              <button onClick={() => setCreateOpen(false)} className="p-1 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Nome do Arco</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome do arco..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Grupos com acesso</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newGroups.map((id) => {
                    const group = availableGroups.find(g => g._id === id);
                    return (
                      <span key={id} className="flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary-light rounded-full text-sm">
                        {group?.name}
                        <button onClick={() => toggleGroup(id)} className="hover:text-white transition-colors"><X size={14} /></button>
                      </span>
                    );
                  })}
                </div>
                <div className="max-h-48 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded-lg">
                  {availableGroups.length === 0 ? (
                    <p className="px-4 py-3 text-zinc-500 text-center">Nenhum grupo disponível</p>
                  ) : (
                    availableGroups.map(group => (
                      <button key={group._id} onClick={() => toggleGroup(group._id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-700 transition-colors text-left">
                        <span className="text-white">{group.name}</span>
                        {newGroups.includes(group._id) && <span className="text-primary">✓</span>}
                      </button>
                    ))
                  )}
                </div>
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
    </div>
  );
}
