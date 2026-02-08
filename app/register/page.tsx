'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { LogIn, UserPlus, ArrowLeft, Loader2, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/rpgs');
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!username || !password || !confirmPassword) {
      setError('Todos os campos são obrigatórios');
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('Usuário deve ter no mínimo 3 caracteres');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          role: 'user',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao registrar');
        setLoading(false);
        return;
      }

      setSuccess('Conta criada com sucesso! Redirecionando para login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      setError('Erro na requisição. Tente novamente.');
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl">
        <div className="p-8 border-b border-zinc-700">
          <h2 className="text-center text-3xl font-extrabold text-white tracking-widest uppercase mb-2">
            Registro
          </h2>
          <p className="text-center text-sm text-zinc-400">
            Ou{' '}
            <Link href="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-light transition-colors">
              <LogIn size={16} /> faça login
            </Link>
          </p>
        </div>

        <form className="p-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/50 p-4 flex items-center gap-2">
              <Check size={18} className="text-green-400" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-zinc-300 font-medium mb-2">
                Usuário
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="Mínimo 3 caracteres"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-zinc-300 font-medium mb-2">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-zinc-300 font-medium mb-2">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Registrar
              </>
            )}
          </button>
        </form>

        <div className="flex justify-between items-center px-8 py-4 border-t border-zinc-700">
          <Link
            href="/login"
            className="text-zinc-400 hover:text-white underline text-sm font-medium transition-colors"
          >
            Já tem conta?
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}
