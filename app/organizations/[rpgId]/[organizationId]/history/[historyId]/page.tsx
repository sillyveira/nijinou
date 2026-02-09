'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, ArrowLeft, BookOpen, Calendar, Users, Edit3, EyeOff } from 'lucide-react';

interface History {
  _id: string;
  chapterName: string;
  content: string;
  year?: number;
  private: boolean;
  ownerId: string;
  characterIds: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Organization {
  _id: string;
  name: string;
}

export default function OrganizationHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const rpgId = params?.rpgId as string;
  const organizationId = params?.organizationId as string;
  const historyId = params?.historyId as string;

  const [history, setHistory] = useState<History | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      if (!rpgId || !organizationId || !historyId) return;

      try {
        const histRes = await fetch(`/api/histories?rpgId=${rpgId}&historyId=${historyId}`);
        const histData = await histRes.json();
        
        if (histData.history) {
          setHistory(histData.history);
          setCanEdit(histData.canEdit || false);
        }

        const orgRes = await fetch(`/api/organizations?rpgId=${rpgId}`);
        const orgData = await orgRes.json();
        const org = orgData.organizations?.find((o: Organization) => o._id === organizationId);
        setOrganization(org || null);

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, rpgId, organizationId, historyId]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!history || !organization) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <BookOpen size={48} className="text-zinc-700" />
        <span className="ml-4 text-zinc-400 text-lg">História não encontrada</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700 shadow-xl">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push(`/organizations/${rpgId}/${organizationId}`)}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Voltar à Organização
            </button>

            {canEdit && (
              <button
                onClick={() => router.push(`/organizations/${rpgId}/${organizationId}/history/${historyId}/editor`)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                <Edit3 size={18} />
                Editar
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-white">{history.chapterName}</h1>
              <p className="text-sm text-zinc-400">{organization.name}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
            {history.year && (
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Ano {history.year}</span>
              </div>
            )}
            {history.characterIds.length > 0 && (
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>{history.characterIds.length} personagem(s)</span>
              </div>
            )}
            {history.private && (
              <div className="flex items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded-full">
                <EyeOff size={12} className="text-red-400" />
                <span className="text-red-400">Privado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {history.imageUrl && (
          <div className="mb-8 rounded-xl overflow-hidden shadow-2xl">
            <img src={history.imageUrl} alt={history.chapterName} className="w-full h-auto" />
          </div>
        )}

        <div
          className="prose prose-invert max-w-none bg-zinc-900 border border-zinc-700 rounded-xl p-8 shadow-xl"
          dangerouslySetInnerHTML={{ __html: history.content || '<p class="text-zinc-500">Sem conteúdo.</p>' }}
        />
      </div>
    </div>
  );
}
