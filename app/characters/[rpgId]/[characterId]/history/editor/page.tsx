'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ChapterEditor from '@/app/components/ChapterEditor';

export default function CharacterHistoryEditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;
  const characterId = params?.characterId as string;

  const [characterName, setCharacterName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchCharacter() {
      try {
        const res = await fetch(`/api/characters?rpgId=${rpgId}&id=${characterId}`);
        const data = await res.json();
        if (data.character) {
          setCharacterName(data.character.name);
        }
      } catch (error) {
        console.error('Erro ao buscar personagem:', error);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated' && rpgId && characterId) {
      fetchCharacter();
    }
  }, [status, rpgId, characterId]);

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
      parentId={characterId}
      parentType="character"
      parentName={characterName}
      backUrl={`/characters/${rpgId}/${characterId}/history`}
    />
  );
}
