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
  Zap,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface Power {
  _id: string;
  sectionId: string;
  ownerId: string;
  name: string;
  imageUrl: string;
  content: string;
  powerType: 'skill' | 'transformation';
  private: boolean;
}

interface PowerSection {
  _id: string;
  name: string;
}

export default function PowerDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rpgId = params?.rpgId as string;
  const characterId = params?.characterId as string;
  const sectionId = params?.sectionId as string;
  const powerId = params?.powerId as string;

  const [power, setPower] = useState<Power | null>(null);
  const [section, setSection] = useState<PowerSection | null>(null);
  const [isRpgOwner, setIsRpgOwner] = useState(false);
  const [isCharOwner, setIsCharOwner] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
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
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      if (!sectionId || !powerId) return;
      try {
        const res = await fetch(`/api/powers?sectionId=${sectionId}&powerId=${powerId}`);
        const data = await res.json();
        if (data.power) {
          setPower(data.power);
          setContent(data.power.content || '');
          setIsPrivate(data.power.private || false);
        }
        if (data.section) setSection(data.section);
        if (data.isRpgOwner !== undefined) setIsRpgOwner(data.isRpgOwner);
        if (data.isCharOwner !== undefined) setIsCharOwner(data.isCharOwner);
        if (data.canEdit !== undefined) setCanEdit(data.canEdit);
      } catch (error) {
        console.error('Erro ao buscar poder:', error);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchData();
  }, [status, sectionId, powerId]);

  const handleSave = async () => {
    if (!power) return;
    setSaving(true);
    try {
      const res = await fetch('/api/powers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          powerId: power._id,
          content,
          private: isPrivate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPower(data.power);
        alert('Poder salvo com sucesso!');
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erro ao salvar poder:', error);
      alert('Erro ao salvar poder');
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

  if (!power) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Zap size={48} className="text-zinc-700" />
        <span className="ml-4 text-zinc-400 text-lg">Poder não encontrado</span>
      </div>
    );
  }

  const TypeIcon = power.powerType === 'skill' ? Sparkles : RefreshCw;
  const typeLabel = power.powerType === 'skill' ? 'Habilidade' : 'Transformação';

  return (
    <div className="min-h-screen bg-secondary">
      {/* Banner */}
      <div className="relative h-48 w-full mb-6 overflow-hidden">
        {power.imageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${power.imageUrl})`,
              filter: 'blur(4px) brightness(0.4)',
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-t from-primary/30 to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <TypeIcon size={36} className="text-primary mb-2" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-2xl">
            {power.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">
              {typeLabel}
            </span>
            {section && (
              <span className="text-sm bg-zinc-700/60 text-zinc-300 px-3 py-1 rounded-full">
                {section.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(`/characters/${rpgId}/${characterId}/powers/${sectionId}`)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar à Seção
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
                title={isPrivate ? 'Tornar público' : 'Tornar privado'}
              >
                {isPrivate ? (
                  <>
                    <EyeOff size={18} />
                    Privado
                  </>
                ) : (
                  <>
                    <Eye size={18} />
                    Público
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

        {/* Editor / Read-only content */}
        {canEdit ? (
          <div className="bg-zinc-900 border quill-dark border-zinc-800 rounded-xl p-6 shadow-xl">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Descreva este poder..."
              className="bg-white rounded-lg"
            />
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
            {content ? (
              <div
                className="prose prose-invert max-w-none ql-editor"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <p className="text-zinc-500 text-center py-8">Nenhum conteúdo ainda.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
