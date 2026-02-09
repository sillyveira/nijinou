'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import HistoryPageBase from '@/app/components/HistoryPageBase';

export default function CharacterHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;
  const characterId = params?.characterId as string;

  const [character, setCharacter] = useState<any>(null);
  const [isRpgOwner, setIsRpgOwner] = useState(false);
  const [isCharacterOwner, setIsCharacterOwner] = useState(false);
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
          setCharacter(data.character);
        }
        if (data.isRpgOwner !== undefined) setIsRpgOwner(data.isRpgOwner);
        if (data.isCharacterOwner !== undefined) setIsCharacterOwner(data.isCharacterOwner);
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

  if (!character) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <span className="text-zinc-400 text-lg">Personagem não encontrado</span>
      </div>
    );
  }

  return (
    <HistoryPageBase
      rpgId={rpgId}
      parentId={characterId}
      parentType="character"
      parentName={character.name}
      historyIds={character.historyIds || []}
      isRpgOwner={isRpgOwner}
      isParentOwner={isCharacterOwner}
      backUrl={`/characters/${rpgId}/${characterId}`}
      editorBasePath={`/characters/${rpgId}/${characterId}/history`}
    />
  );
}
