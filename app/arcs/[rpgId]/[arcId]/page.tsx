'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import HistoryPageBase from '@/app/components/HistoryPageBase';

export default function ArcHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;
  const arcId = params?.arcId as string;

  const [arc, setArc] = useState<any>(null);
  const [isRpgOwner, setIsRpgOwner] = useState(false);
  const [isArcOwner, setIsArcOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchArc() {
      try {
        const res = await fetch(`/api/arcs?rpgId=${rpgId}&id=${arcId}`);
        const data = await res.json();
        if (data.arc) {
          setArc(data.arc);
        }
        if (data.isRpgOwner !== undefined) setIsRpgOwner(data.isRpgOwner);
        if (data.isArcOwner !== undefined) setIsArcOwner(data.isArcOwner);
      } catch (error) {
        console.error('Erro ao buscar arco:', error);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated' && rpgId && arcId) {
      fetchArc();
    }
  }, [status, rpgId, arcId]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!arc) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <span className="text-zinc-400 text-lg">Arco não encontrado</span>
      </div>
    );
  }

  return (
    <HistoryPageBase
      rpgId={rpgId}
      parentId={arcId}
      parentType="arc"
      parentName={arc.name}
      historyIds={arc.historyIds || []}
      isRpgOwner={isRpgOwner}
      isParentOwner={isArcOwner}
      backUrl={`/arcs/${rpgId}`}
      editorBasePath={`/arcs/${rpgId}/${arcId}`}
    />
  );
}
