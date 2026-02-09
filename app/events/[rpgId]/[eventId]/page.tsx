'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import HistoryPageBase from '@/app/components/HistoryPageBase';

export default function EventHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;
  const eventId = params?.eventId as string;

  const [event, setEvent] = useState<any>(null);
  const [isRpgOwner, setIsRpgOwner] = useState(false);
  const [isEventOwner, setIsEventOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events?rpgId=${rpgId}&id=${eventId}`);
        const data = await res.json();
        if (data.event) {
          setEvent(data.event);
        }
        if (data.isRpgOwner !== undefined) setIsRpgOwner(data.isRpgOwner);
        if (data.isEventOwner !== undefined) setIsEventOwner(data.isEventOwner);
      } catch (error) {
        console.error('Erro ao buscar evento:', error);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated' && rpgId && eventId) {
      fetchEvent();
    }
  }, [status, rpgId, eventId]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <span className="text-zinc-400 text-lg">Evento não encontrado</span>
      </div>
    );
  }

  return (
    <HistoryPageBase
      rpgId={rpgId}
      parentId={eventId}
      parentType="event"
      parentName={event.name}
      historyIds={event.historyIds || []}
      isRpgOwner={isRpgOwner}
      isParentOwner={isEventOwner}
      backUrl={`/events/${rpgId}`}
      editorBasePath={`/events/${rpgId}/${eventId}`}
    />
  );
}
