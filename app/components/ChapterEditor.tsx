'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import {
  Loader2,
  X,
  EyeOff,
  Eye,
  Calendar,
  BookOpen,
  ArrowLeft,
  Users,
  Save,
} from 'lucide-react';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface CharacterOption {
  _id: string;
  name: string;
}

interface Props {
  rpgId: string;
  parentId: string;
  parentType: 'character' | 'arc' | 'event' | 'organization';
  historyId?: string;
  parentName?: string;
  backUrl: string;
}

export default function ChapterEditor({
  rpgId,
  parentId,
  parentType,
  historyId: historyIdProp,
  parentName,
  backUrl,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const historyId = historyIdProp || searchParams.get('id');

  const [loading, setLoading] = useState(!!historyId);
  const [saving, setSaving] = useState(false);

  const [chapterName, setChapterName] = useState('');
  const [content, setContent] = useState('');
  const [year, setYear] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [characterIds, setCharacterIds] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);

  const [availableCharacters, setAvailableCharacters] = useState<CharacterOption[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  // Se editando, buscar história existente
  useEffect(() => {
    async function fetchHistory() {
      if (!historyId) return;
      try {
        const res = await fetch(`/api/histories?rpgId=${rpgId}&id=${historyId}`);
        const data = await res.json();
        if (data.history) {
          setChapterName(data.history.chapterName);
          setContent(data.history.content);
          setYear(data.history.year?.toString() || '');
          setImageUrl(data.history.imageUrl || '');
          setCharacterIds(data.history.characterIds || []);
          setIsPrivate(data.history.private || false);
        }
      } catch (error) {
        console.error('Erro ao buscar história:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [historyId, rpgId]);

  // Buscar personagens do RPG
  useEffect(() => {
    async function fetchChars() {
      try {
        const res = await fetch(`/api/characters?rpgId=${rpgId}`);
        const data = await res.json();
        if (data.characters) {
          setAvailableCharacters(data.characters.map((c: any) => ({ _id: c._id, name: c.name })));
        }
      } catch (error) {
        console.error('Erro ao buscar personagens:', error);
      }
    }
    fetchChars();
  }, [rpgId]);

  const toggleCharacter = (id: string) => {
    if (characterIds.includes(id)) {
      setCharacterIds(characterIds.filter(c => c !== id));
    } else {
      setCharacterIds([...characterIds, id]);
    }
  };

  const handleSave = async () => {
    if (!chapterName.trim() || !content.trim()) return;
    setSaving(true);
    try {
      if (historyId) {
        // Atualizar
        const res = await fetch('/api/histories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            historyId,
            chapterName,
            content,
            year: year ? parseInt(year) : undefined,
            imageUrl,
            characterIds,
            privateHistory: isPrivate,
          }),
        });
        if (res.ok) {
          router.push(backUrl);
        }
      } else {
        // Criar
        const res = await fetch('/api/histories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rpgId,
            parentId,
            parentType,
            chapterName,
            content,
            year: year ? parseInt(year) : undefined,
            imageUrl,
            characterIds,
            privateHistory: isPrivate,
          }),
        });
        if (res.ok) {
          router.push(backUrl);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar história:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <div className="relative h-36 w-full mb-6 rounded-b-xl overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-primary/30 to-zinc-900" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <BookOpen size={32} className="text-primary mb-1" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-2xl">
            {historyId ? 'Editar Capítulo' : 'Novo Capítulo'}
          </h1>
          <p className="text-zinc-400 text-sm">{parentName}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Voltar */}
        <button
          onClick={() => router.push(backUrl)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar aos capítulos
        </button>

        <div className="space-y-6">
          {/* Nome do capítulo */}
          <div>
            <label className="block text-zinc-300 font-medium mb-2">Nome do Capítulo</label>
            <input
              type="text"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              placeholder="Nome do capítulo..."
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ano */}
            <div>
              <label className="block text-zinc-300 font-medium mb-2">Ano (opcional)</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Ex: 1200"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* URL da Imagem */}
            <div>
              <label className="block text-zinc-300 font-medium mb-2">Imagem de capa (URL)</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Personagens vinculados */}
          <div>
            <label className="block text-zinc-300 font-medium mb-2">Personagens vinculados</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {characterIds.map(id => {
                const char = availableCharacters.find(c => c._id === id);
                return (
                  <span key={id} className="flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary-light rounded-full text-sm">
                    <Users size={14} />
                    {char?.name || 'Personagem'}
                    <button onClick={() => toggleCharacter(id)} className="hover:text-white transition-colors ml-1">
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="max-h-36 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded-lg">
              {availableCharacters.length === 0 ? (
                <p className="px-4 py-3 text-zinc-500 text-center text-sm">Nenhum personagem disponível</p>
              ) : (
                availableCharacters.map(c => (
                  <button
                    key={c._id}
                    onClick={() => toggleCharacter(c._id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-700 transition-colors text-left"
                  >
                    <span className="text-white text-sm">{c.name}</span>
                    {characterIds.includes(c._id) && (
                      <span className="text-primary">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Privado */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="history-private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-5 h-5 bg-zinc-800 border-zinc-600 rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="history-private" className="text-zinc-300 font-medium flex items-center gap-2">
              {isPrivate ? <EyeOff size={18} /> : <Eye size={18} />}
              Capítulo Privado
            </label>
          </div>

          {/* Editor Quill */}
          <div>
            <label className="block text-zinc-300 font-medium mb-2">Conteúdo</label>
            <div className="quill-dark rounded-lg overflow-hidden">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Escreva o conteúdo do capítulo..."
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={() => router.push(backUrl)}
              className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => setPreviewOpen(true)}
              className="px-6 py-3 bg-zinc-600 hover:bg-zinc-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Eye size={20} />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !chapterName.trim() || !content.trim()}
              className="flex-1 px-4 py-3 bg-primary hover:bg-primary/80 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {historyId ? 'Salvar' : 'Criar Capítulo'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Preview */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-white">Preview: {chapterName || 'Sem título'}</h2>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-5">
              {year && (
                <p className="text-zinc-400 flex items-center gap-2 mb-4">
                  <Calendar size={16} />
                  Ano {year}
                </p>
              )}
              <div
                className="prose prose-invert prose-lg max-w-none ql-editor-view"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
