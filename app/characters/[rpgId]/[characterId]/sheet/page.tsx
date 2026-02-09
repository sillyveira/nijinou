'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import {
  Loader2,
  ArrowLeft,
  Save,
  EyeOff,
  Eye,
  FileText,
} from 'lucide-react';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface Character {
  _id: string;
  name: string;
  sheetId: string;
  ownerId: string;
  rpgId: string;
}

interface Sheet {
  _id: string;
  content: string;
  private: boolean;
}

export default function CharacterSheetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;
  const characterId = params?.characterId as string;

  const [character, setCharacter] = useState<Character | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [isRpgOwner, setIsRpgOwner] = useState(false);
  const [isCharacterOwner, setIsCharacterOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline'],
        [{ color: [] }],
        ['image'],
        ['clean'],
      ],
      handlers: {
        image: function () {
          const url = prompt('Cole a URL da imagem pública:');
          if (url) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const quill = (this as any).quill;
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', url);
            quill.setSelection(range.index + 1);
          }
        },
      },
    },
  }), []);

  const quillFormats = useMemo(() => [
    'size', 'bold', 'italic', 'underline', 'color', 'image'
  ], []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Buscar personagem
  useEffect(() => {
    async function fetchCharacter() {
      try {
        const res = await fetch(`/api/characters?rpgId=${rpgId}&id=${characterId}`);
        const data = await res.json();
        if (data.character) {
          setCharacter(data.character);
          if (data.isRpgOwner !== undefined) setIsRpgOwner(data.isRpgOwner);
          if (data.isCharacterOwner !== undefined) setIsCharacterOwner(data.isCharacterOwner);

          // Buscar a ficha
          if (data.character.sheetId) {
            fetchSheet(data.character.sheetId, data.isRpgOwner, data.isCharacterOwner);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar personagem:', error);
        setLoading(false);
      }
    }
    if (status === 'authenticated' && rpgId && characterId) {
      fetchCharacter();
    }
  }, [status, rpgId, characterId]);

  async function fetchSheet(sheetId: string, rpgOwner: boolean, charOwner: boolean) {
    try {
      const res = await fetch(`/api/sheets?id=${sheetId}`);
      const data = await res.json();
      if (data.sheet) {
        setSheet(data.sheet);
        setContent(data.sheet.content || '');
        setIsPrivate(data.sheet.private || false);
      }
    } catch (error) {
      console.error('Erro ao buscar ficha:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!sheet) return;
    setSaving(true);
    try {
      const res = await fetch('/api/sheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId: sheet._id,
          content,
          privateSheet: isPrivate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSheet(data.sheet);
        alert('Ficha salva com sucesso!');
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erro ao salvar ficha:', error);
      alert('Erro ao salvar ficha');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!character || !sheet) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <FileText size={48} className="text-black" />
        <span className="ml-4 text-black text-lg">Ficha não encontrada</span>
      </div>
    );
  }

  const canEdit = isRpgOwner || isCharacterOwner;

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <div className="relative h-32 w-full mb-8 rounded-b-xl overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-primary/40 to-zinc-900" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <FileText size={40} className="text-primary mb-2" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-2xl">
            Ficha de {character.name}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(`/characters/${rpgId}/${characterId}`)}
            className="flex items-center gap-2 text-black hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>

          <div className="flex items-center gap-3">
            {/* Toggle Privacidade */}
            {canEdit && (
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                  isPrivate
                    ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                    : 'bg-blue-900/40 hover:bg-blue-800/60 text-blue-300'
                }`}
                title={isPrivate ? 'Tornar pública' : 'Tornar privada'}
              >
                {isPrivate ? (
                  <>
                    <EyeOff size={18} />
                    Privada
                  </>
                ) : (
                  <>
                    <Eye size={18} />
                    Pública
                  </>
                )}
              </button>
            )}

            {/* Botão Salvar */}
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                Salvar
              </button>
            )}
          </div>
        </div>

        {/* Editor */}
        {canEdit ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Escreva a ficha do personagem..."
              className="bg-white rounded-lg"
            />
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
            <div
              className="prose prose-invert max-w-none ql-editor"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
