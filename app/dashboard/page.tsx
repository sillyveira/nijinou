'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, User, Shield, Hash, Folder } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user as any;

  return (
    <div className="min-h-screen bg-secondary">
      <main className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2">Dashboard</h1>
          <p className="text-zinc-400">Bem-vindo, <span className="text-primary-light font-semibold">{user.username}</span>!</p>
        </div>

        {/* Grid de informações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card - Username */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <User size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white">Usuário</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-1">Nome de usuário</p>
            <p className="text-white font-mono text-lg">{user.username}</p>
          </div>

          {/* Card - Role */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white">Função</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-1">Seu cargo</p>
            <div className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 text-primary-light capitalize">
              {user.role}
            </div>
          </div>

          {/* Card - ID */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Hash size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white">ID</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-1">Identificador único</p>
            <p className="text-white font-mono text-xs break-all">{user.id}</p>
          </div>

          {/* Card - Grupos */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Folder size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white">Grupos</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-3">Grupos que você faz parte</p>
            {user.groups && user.groups.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.groups.map((group: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary-light"
                  >
                    {group}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Você ainda não faz parte de nenhum grupo</p>
            )}
          </div>
        </div>

        {/* Seção de conteúdo protegido */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Conteúdo Protegido</h2>
          <div className="space-y-4">
            <p className="text-zinc-300">
              ✓ Esta página é <span className="text-primary-light font-semibold">exclusiva para usuários autenticados</span>.
            </p>
            <p className="text-zinc-300">
              ✓ Você está logado e tem acesso completo ao sistema.
            </p>
            <p className="text-zinc-300">
              ✓ Navegue pelos menus para explorar as funcionalidades disponíveis.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
