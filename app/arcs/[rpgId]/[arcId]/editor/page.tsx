'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ChapterEditor from '@/app/components/ChapterEditor';

export default function ArcEditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;
  const arcId = params?.arcId as string;

  const [arcName, setArcName] = useState('');
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
          setArcName(data.arc.name);
        }
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

  return (
    <ChapterEditor
      rpgId={rpgId}
      parentId={arcId}
      parentType="arc"
      parentName={arcName}
      backUrl={`/arcs/${rpgId}/${arcId}`}
    />
  );
}
