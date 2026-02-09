'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ChapterEditor from '@/app/components/ChapterEditor';

export default function EventEditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;
  const eventId = params?.eventId as string;

  const [eventName, setEventName] = useState('');
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
          setEventName(data.event.name);
        }
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

  return (
    <ChapterEditor
      rpgId={rpgId}
      parentId={eventId}
      parentType="event"
      parentName={eventName}
      backUrl={`/events/${rpgId}/${eventId}`}
    />
  );
}
