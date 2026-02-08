'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Crown,
  Users,
  X,
  Trash2,
  UserPlus,
  ChevronDown,
  Check,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

interface Group {
  _id: string;
  name: string;
  ownerId: string;
}

interface UserType {
  _id: string;
  username: string;
  role: string;
  groups: string[];
}

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal de criar grupo
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Modal de detalhes do grupo
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<UserType[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Modal de adicionar membro
  const [addMemberDropdownOpen, setAddMemberDropdownOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);

  // Modal de deletar grupo
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const addMemberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Buscar grupos
  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch('/api/groups');
        const data = await res.json();
        if (data.groups) {
          setGroups(data.groups);
          setUserId(data.userId);
        }
      } catch (error) {
        console.error('Erro ao buscar grupos:', error);
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchGroups();
    }
  }, [status]);

  // Buscar usuários para criar grupo
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (data.users) {
          // Filtrar o próprio usuário
          setAllUsers(data.users.filter((u: UserType) => u._id !== userId));
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    }

    if (createModalOpen && userId) {
      fetchUsers();
    }
  }, [createModalOpen, userId]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (addMemberRef.current && !addMemberRef.current.contains(event.target as Node)) {
        setAddMemberDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Criar grupo
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          memberIds: selectedUsers,
        }),
      });

      const data = await res.json();
      if (data.group) {
        setGroups([...groups, data.group]);
        setCreateModalOpen(false);
        setNewGroupName('');
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
    } finally {
      setCreating(false);
    }
  };

  // Ver detalhes do grupo
  const handleViewGroup = async (group: Group) => {
    setSelectedGroup(group);
    setDetailsModalOpen(true);
    setLoadingMembers(true);

    try {
      const res = await fetch(`/api/groups/members?groupId=${group._id}`);
      const data = await res.json();
      if (data.members) {
        setMembers(data.members);
        setIsOwner(data.isOwner);
      }
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Buscar usuários disponíveis para adicionar
  const handleOpenAddMember = async () => {
    if (!selectedGroup) return;

    setAddMemberDropdownOpen(true);
    try {
      const res = await fetch(`/api/users?excludeGroupId=${selectedGroup._id}`);
      const data = await res.json();
      if (data.users) {
        setAvailableUsers(data.users);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  // Adicionar membro
  const handleAddMember = async (userIdToAdd: string) => {
    if (!selectedGroup) return;

    try {
      const res = await fetch('/api/groups/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup._id,
          userId: userIdToAdd,
        }),
      });

      if (res.ok) {
        // Atualizar lista de membros
        handleViewGroup(selectedGroup);
        setAddMemberDropdownOpen(false);
      }
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
    }
  };

  // Remover membro
  const handleRemoveMember = async (userIdToRemove: string) => {
    if (!selectedGroup) return;

    try {
      const res = await fetch('/api/groups/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup._id,
          userId: userIdToRemove,
        }),
      });

      if (res.ok) {
        setMembers(members.filter((m) => m._id !== userIdToRemove));
      }
    } catch (error) {
      console.error('Erro ao remover membro:', error);
    }
  };

  // Deletar grupo
  const handleDeleteGroup = async () => {
    if (!selectedGroup || deleteConfirmName !== selectedGroup.name) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup._id,
          confirmName: deleteConfirmName,
        }),
      });

      if (res.ok) {
        setGroups(groups.filter((g) => g._id !== selectedGroup._id));
        setDeleteModalOpen(false);
        setDetailsModalOpen(false);
        setSelectedGroup(null);
        setDeleteConfirmName('');
      }
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Toggle seleção de usuário
  const toggleUserSelection = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((u) => u !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold text-white">Meus Grupos</h1>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Plus size={20} />
            Novo Grupo
          </button>
        </div>

        {/* Lista de grupos */}
        {groups.length === 0 ? (
          <div className="text-center py-16">
            <Users size={64} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400 text-lg">Você ainda não faz parte de nenhum grupo.</p>
            <p className="text-zinc-500 mt-2">Crie um novo grupo para começar!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <button
                key={group._id}
                onClick={() => handleViewGroup(group)}
                className="w-full flex items-center justify-between p-5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition-all shadow-md hover:shadow-lg text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users size={24} className="text-primary" />
                  </div>
                  <span className="text-white font-semibold text-lg">{group.name}</span>
                </div>
                {group.ownerId === userId && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full">
                    <Crown size={18} className="text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-medium">Dono</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal de criar grupo */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-white">Criar Novo Grupo</h2>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setNewGroupName('');
                  setSelectedUsers([]);
                }}
                className="p-1 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Nome do grupo */}
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Nome do grupo</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Digite o nome do grupo"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Seletor de membros */}
              <div ref={userDropdownRef}>
                <label className="block text-zinc-300 font-medium mb-2">Adicionar membros</label>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white hover:bg-zinc-700 transition-colors"
                >
                  <span className="text-zinc-400">
                    {selectedUsers.length > 0
                      ? `${selectedUsers.length} usuário(s) selecionado(s)`
                      : 'Selecionar usuários'}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-zinc-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {userDropdownOpen && (
                  <div className="mt-2 max-h-48 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl">
                    {allUsers.length === 0 ? (
                      <p className="px-4 py-3 text-zinc-500 text-center">Nenhum usuário disponível</p>
                    ) : (
                      allUsers.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => toggleUserSelection(user._id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-700 transition-colors text-left"
                        >
                          <span className="text-white">{user.username}</span>
                          {selectedUsers.includes(user._id) && (
                            <Check size={18} className="text-primary" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Usuários selecionados */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((id) => {
                    const user = allUsers.find((u) => u._id === id);
                    return (
                      <span
                        key={id}
                        className="flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary-light rounded-full text-sm"
                      >
                        {user?.username}
                        <button
                          onClick={() => toggleUserSelection(id)}
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
                  setNewGroupName('');
                  setSelectedUsers([]);
                }}
                className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || creating}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalhes do grupo */}
      {detailsModalOpen && selectedGroup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">{selectedGroup.name}</h2>
                {isOwner && <Crown size={20} className="text-yellow-400" />}
              </div>
              <button
                onClick={() => {
                  setDetailsModalOpen(false);
                  setSelectedGroup(null);
                  setMembers([]);
                }}
                className="p-1 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-zinc-300 font-medium">Membros ({members.length})</h3>
                {isOwner && (
                  <div className="relative" ref={addMemberRef}>
                    <button
                      onClick={handleOpenAddMember}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary-light rounded-lg transition-colors text-sm"
                    >
                      <UserPlus size={16} />
                      Adicionar
                    </button>

                    {addMemberDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 max-h-48 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl z-10">
                        {availableUsers.length === 0 ? (
                          <p className="px-4 py-3 text-zinc-500 text-center text-sm">
                            Nenhum usuário disponível
                          </p>
                        ) : (
                          availableUsers.map((user) => (
                            <button
                              key={user._id}
                              onClick={() => handleAddMember(user._id)}
                              className="w-full px-4 py-3 hover:bg-zinc-700 transition-colors text-left text-white"
                            >
                              {user.username}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {loadingMembers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light font-bold">
                          {member.username[0].toUpperCase()}
                        </div>
                        <span className="text-white">{member.username}</span>
                        {selectedGroup.ownerId === member._id && (
                          <Crown size={16} className="text-yellow-400" />
                        )}
                      </div>
                      {isOwner && selectedGroup.ownerId !== member._id && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="p-2 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                          title="Remover membro"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isOwner && (
              <div className="p-5 border-t border-zinc-700">
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                  Excluir Grupo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteModalOpen && selectedGroup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-zinc-900 border border-red-500/50 rounded-xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
                <Trash2 size={24} />
                Excluir Grupo
              </h2>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-zinc-300">
                Esta ação é <span className="text-red-400 font-semibold">irreversível</span>. Todos os
                membros serão removidos do grupo.
              </p>
              <p className="text-zinc-400 text-sm">
                Digite <span className="font-mono text-white bg-zinc-800 px-2 py-1 rounded">{selectedGroup.name}</span> para confirmar:
              </p>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Nome do grupo"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 p-5 border-t border-zinc-700">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteConfirmName('');
                }}
                className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={deleteConfirmName !== selectedGroup.name || deleting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
