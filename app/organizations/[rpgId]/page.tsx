'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  Loader2,
  Building2,
  ArrowLeft,
  Plus,
  X,
  Search,
  EyeOff,
  Crown,
  Trash2,
  Pencil,
} from 'lucide-react';

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
  createdAt: string;
}

interface Group {
  _id: string;
  name: string;
}

export default function OrganizationsListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [isRpgOwner, setIsRpgOwner] = useState(false);
  const userId = session?.user?.id;

  // Modal de criação
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSince, setNewSince] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newPrivate, setNewPrivate] = useState(false);
  const [newGroups, setNewGroups] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);

  // Modal de edição
  const [editOpen, setEditOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editName, setEditName] = useState('');
  const [editSince, setEditSince] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editPrivate, setEditPrivate] = useState(false);
  const [editGroups, setEditGroups] = useState<string[]>([]);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchOrganizations() {
      if (!rpgId) return;
      try {
        const res = await fetch(`/api/organizations?rpgId=${rpgId}`);
        const data = await res.json();
        if (data.organizations) {
          setOrganizations(data.organizations);
          setIsRpgOwner(data.isRpgOwner || false);
        }
      } catch (error) {
        console.error('Erro ao buscar organizações:', error);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchOrganizations();
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
    if (createOpen || editOpen) fetchGroups();
  }, [createOpen, editOpen]);

  const handleCreate = async () => {
    if (!newName.trim() || !newSince.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rpgId,
          name: newName,
          since: newSince,
          imageUrl: newImageUrl,
          private: newPrivate,
          groupsAllowed: newGroups,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrganizations(prev => [data.organization, ...prev]);
        setCreateOpen(false);
        setNewName('');
        setNewSince('');
        setNewImageUrl('');
        setNewPrivate(false);
        setNewGroups([]);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao criar organização');
      }
    } catch (error) {
      console.error('Erro ao criar organização:', error);
      alert('Erro ao criar organização');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (org: Organization) => {
    setEditingOrg(org);
    setEditName(org.name);
    setEditSince(org.since);
    setEditImageUrl(org.imageUrl);
    setEditPrivate(org.private);
    setEditGroups(org.groupsAllowed);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingOrg || !editName.trim() || !editSince.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/organizations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: editingOrg._id,
          name: editName,
          since: editSince,
          imageUrl: editImageUrl,
          private: editPrivate,
          groupsAllowed: editGroups,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrganizations(prev => prev.map(o => o._id === data.organization._id ? data.organization : o));
        setEditOpen(false);
        setEditingOrg(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao editar organização');
      }
    } catch (error) {
      console.error('Erro ao editar organização:', error);
      alert('Erro ao editar organização');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (orgId: string) => {
    try {
      const res = await fetch('/api/organizations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      });
      if (res.ok) {
        setOrganizations(prev => prev.filter(o => o._id !== orgId));
        setDeleteConfirm(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao deletar organização');
      }
    } catch (error) {
      console.error('Erro ao deletar organização:', error);
      alert('Erro ao deletar organização');
    }
  };

  const toggleGroup = (id: string, isEdit: boolean) => {
    if (isEdit) {
      if (editGroups.includes(id)) {
        setEditGroups(editGroups.filter(g => g !== id));
      } else {
        setEditGroups([...editGroups, id]);
      }
    } else {
      if (newGroups.includes(id)) {
        setNewGroups(newGroups.filter(g => g !== id));
      } else {
        setNewGroups([...newGroups, id]);
      }
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchName.toLowerCase())
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
            onClick={() => router.push(`/rpgs/${rpgId}`)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar ao RPG
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Plus size={20} />
            Nova Organização
          </button>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <Building2 size={32} className="text-primary" />
          <h1 className="text-3xl font-bold text-white">Organizações</h1>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Buscar organização..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* List */}
        {filteredOrganizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Building2 size={64} className="text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-lg">Nenhuma organização encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOrganizations.map((org) => {
              const isOwner = org.ownerId.includes(userId || '');
              const canEdit = isOwner || isRpgOwner;

              return (
                <div
                  key={org._id}
                  className="relative group bg-zinc-900 border border-zinc-800 hover:border-primary/40 rounded-xl overflow-hidden cursor-pointer transition-all shadow-lg"
                  onClick={() => router.push(`/organizations/${rpgId}/${org._id}`)}
                >
                  {/* Image or placeholder */}
                  {org.imageUrl ? (
                    <img src={org.imageUrl} alt={org.name} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      <Building2 size={48} className="text-zinc-700" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white mb-1">{org.name}</h3>
                    <p className="text-sm text-zinc-400 mb-3">Desde {org.since}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>{org.characterIds.length} personagem(s)</span>
                      <span>•</span>
                      <span>{org.historyIds.length} história(s)</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1">
                    {org.private && (
                      <div className="flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded-full">
                        <EyeOff size={12} className="text-red-400" />
                        <span className="text-red-400 text-xs">Privado</span>
                      </div>
                    )}
                    {isOwner && (
                      <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                        <Crown size={12} className="text-yellow-400" />
                        <span className="text-yellow-400 text-xs">Dono</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {canEdit && (
                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(org); }}
                        className="p-1.5 bg-blue-900/40 hover:bg-blue-800/60 rounded-lg transition-colors"
                      >
                        <Pencil size={16} className="text-blue-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(org._id); }}
                        className="p-1.5 bg-red-900/40 hover:bg-red-800/60 rounded-lg transition-colors"
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
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 flex items-center justify-between p-5 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-white">Nova Organização</h2>
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
                  placeholder="Nome da organização..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Fundação *</label>
                <input
                  type="text"
                  value={newSince}
                  onChange={(e) => setNewSince(e.target.value)}
                  placeholder="Ex: 1850, Terceira Era..."
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
                  <input
                    type="checkbox"
                    checked={newPrivate}
                    onChange={(e) => setNewPrivate(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-zinc-300 font-medium">Privado</span>
                </label>
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Grupos com acesso</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newGroups.map((id) => {
                    const group = availableGroups.find(g => g._id === id);
                    return (
                      <span key={id} className="flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary-light rounded-full text-sm">
                        {group?.name}
                        <button onClick={() => toggleGroup(id, false)} className="hover:text-white transition-colors"><X size={14} /></button>
                      </span>
                    );
                  })}
                </div>
                <div className="max-h-48 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded-lg">
                  {availableGroups.length === 0 ? (
                    <p className="px-4 py-3 text-zinc-500 text-center">Nenhum grupo disponível</p>
                  ) : (
                    availableGroups.map(group => (
                      <button key={group._id} onClick={() => toggleGroup(group._id, false)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-700 transition-colors text-left">
                        <span className="text-white">{group.name}</span>
                        {newGroups.includes(group._id) && <span className="text-primary">✓</span>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-zinc-900 flex gap-3 p-5 border-t border-zinc-700">
              <button onClick={() => setCreateOpen(false)} className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={handleCreate}
                disabled={saving || !newName.trim() || !newSince.trim()}
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
      {editOpen && editingOrg && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 flex items-center justify-between p-5 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-white">Editar Organização</h2>
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
                  placeholder="Nome da organização..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Fundação *</label>
                <input
                  type="text"
                  value={editSince}
                  onChange={(e) => setEditSince(e.target.value)}
                  placeholder="Ex: 1850, Terceira Era..."
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
                  <input
                    type="checkbox"
                    checked={editPrivate}
                    onChange={(e) => setEditPrivate(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-zinc-300 font-medium">Privado</span>
                </label>
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Grupos com acesso</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editGroups.map((id) => {
                    const group = availableGroups.find(g => g._id === id);
                    return (
                      <span key={id} className="flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary-light rounded-full text-sm">
                        {group?.name}
                        <button onClick={() => toggleGroup(id, true)} className="hover:text-white transition-colors"><X size={14} /></button>
                      </span>
                    );
                  })}
                </div>
                <div className="max-h-48 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded-lg">
                  {availableGroups.length === 0 ? (
                    <p className="px-4 py-3 text-zinc-500 text-center">Nenhum grupo disponível</p>
                  ) : (
                    availableGroups.map(group => (
                      <button key={group._id} onClick={() => toggleGroup(group._id, true)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-700 transition-colors text-left">
                        <span className="text-white">{group.name}</span>
                        {editGroups.includes(group._id) && <span className="text-primary">✓</span>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-zinc-900 flex gap-3 p-5 border-t border-zinc-700">
              <button onClick={() => setEditOpen(false)} className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={handleEdit}
                disabled={saving || !editName.trim() || !editSince.trim()}
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
            <p className="text-zinc-400 mb-6">Tem certeza de que deseja excluir esta organização?</p>
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
