'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { Loader2, Save, ArrowLeft, Users, Lock, Unlock } from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface CharacterFeat {
  _id: string;
  rpgId: string;
  arcId: string;
  characterId: string;
  ownerId: string;
  private: boolean;
  content: string;
}

interface Character {
  _id: string;
  name: string;
  ownerId: string;
}

interface RPG {
  _id: string;
  ownerId: string;
}

export default function CharacterFeatEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const rpgId = params?.rpgId as string;
  const arcId = params?.arcId as string;
  const characterFeatId = params?.characterFeatId as string;

  const [characterFeat, setCharacterFeat] = useState<CharacterFeat | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [rpg, setRpg] = useState<RPG | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const userId = session?.user?.id;

  const isCharacterOwner = character?.ownerId === userId;
  const isRpgOwner = rpg?.ownerId === userId;
  const canEdit = isCharacterOwner || isRpgOwner;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      if (!rpgId || !arcId || !characterFeatId) return;
      
      try {
        // Fetch character feat
        const featRes = await fetch(`/api/characterFeats?rpgId=${rpgId}&arcId=${arcId}`);
        const featData = await featRes.json();
        const feat = featData.characterFeats?.find((f: CharacterFeat) => f._id === characterFeatId);
        
        if (!feat) {
          setLoading(false);
          return;
        }

        setCharacterFeat(feat);
        setContent(feat.content || '');
        setIsPrivate(feat.private || false);

        // Fetch character
        const charRes = await fetch(`/api/characters?rpgId=${rpgId}`);
        const charData = await charRes.json();
        const char = charData.characters?.find((c: Character) => c._id === feat.characterId);
        setCharacter(char || null);

        // Fetch RPG
        const rpgRes = await fetch(`/api/rpgs?id=${rpgId}`);
        const rpgData = await rpgRes.json();
        setRpg(rpgData.rpg || null);

        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, rpgId, arcId, characterFeatId]);

  const handleSave = async () => {
    if (!characterFeat) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/characterFeats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterFeatId: characterFeat._id,
          content,
          private: isPrivate,
        }),
      });

      if (res.ok) {
        alert('Progresso salvo com sucesso!');
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar progresso');
    } finally {
      setSaving(false);
    }
  };

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean'],
    ],
  }), []);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!characterFeat || !character) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Users size={48} className="text-zinc-700" />
        <span className="ml-4 text-zinc-400 text-lg">Progresso não encontrado</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push(`/arcs/${rpgId}/${arcId}`)}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Voltar ao Arco
            </button>
            
            {canEdit && (
              <div className="flex items-center gap-3">
                {/* Privacy toggle */}
                <button
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isPrivate
                      ? 'bg-red-900/40 hover:bg-red-800/60 text-red-400'
                      : 'bg-green-900/40 hover:bg-green-800/60 text-green-400'
                  }`}
                >
                  {isPrivate ? (
                    <>
                      <Lock size={18} />
                      Privado
                    </>
                  ) : (
                    <>
                      <Unlock size={18} />
                      Público
                    </>
                  )}
                </button>

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Users size={28} className="text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-white">{character.name}</h1>
              <p className="text-sm text-zinc-400">Progresso do Personagem</p>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl">
          {canEdit ? (
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              className="quill-editor"
              placeholder="Escreva o progresso do personagem neste arco..."
            />
          ) : (
            <div className="p-8">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content || '<p class="text-zinc-500">Sem conteúdo.</p>' }}
              />
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .quill-editor {
          background: #18181b;
          color: white;
        }
        .quill-editor .ql-toolbar {
          background: #27272a;
          border: none;
          border-bottom: 1px solid #3f3f46;
        }
        .quill-editor .ql-container {
          border: none;
          font-size: 16px;
          min-height: 600px;
        }
        .quill-editor .ql-editor {
          color: white;
          min-height: 600px;
        }
        .quill-editor .ql-editor.ql-blank::before {
          color: #71717a;
        }
        .quill-editor .ql-stroke {
          stroke: #a1a1aa;
        }
        .quill-editor .ql-fill {
          fill: #a1a1aa;
        }
        .quill-editor .ql-picker-label {
          color: #a1a1aa;
        }
        .quill-editor .ql-toolbar button:hover,
        .quill-editor .ql-toolbar button.ql-active {
          color: #e879f9;
        }
        .quill-editor .ql-toolbar button:hover .ql-stroke,
        .quill-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #e879f9;
        }
        .quill-editor .ql-toolbar button:hover .ql-fill,
        .quill-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #e879f9;
        }
      `}</style>
    </div>
  );
}
