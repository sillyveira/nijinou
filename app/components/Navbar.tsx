'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Brain, Menu, X, Folder, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (!session) return null;

  return (
    <nav className="bg-secondary border-b border-zinc-700 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Ícone de cérebro vermelho */}
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Brain size={32} className="text-primary" />
            <span className="text-white font-bold text-xl hidden sm:inline">NIJINOU</span>
          </Link>

          {/* Desktop - Menu do usuário */}
          <div className="hidden md:flex items-center">
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light font-bold border border-primary/50">
                  {session.user?.name?.[0]?.toUpperCase() || <User size={20} />}
                </div>
                <span className="text-white font-medium">
                  {session.user?.name || session.user?.email}
                </span>
              </button>

              {/* Menu dropdown do usuário */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
                  <Link
                    href="/groups"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-zinc-800 transition-colors"
                  >
                    <Folder size={20} className="text-primary" />
                    <span>Meus Grupos</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-zinc-800 transition-colors border-t border-zinc-700"
                  >
                    <LogOut size={20} className="text-primary" />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile - Botão hambúrguer */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-white hover:bg-zinc-800 transition-colors"
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile - Menu hambúrguer expandido */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-secondary border-t border-zinc-700">
          <div className="px-4 py-4 space-y-3">
            {/* Informações do usuário */}
            <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary-light font-bold border border-primary/50">
                {session.user?.name?.[0]?.toUpperCase() || <User size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {session.user?.name || 'Usuário'}
                </p>
                <p className="text-zinc-400 text-sm truncate">
                  {session.user?.email}
                </p>
              </div>
            </div>

            {/* Links do menu mobile */}
            <Link
              href="/groups"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Folder size={22} className="text-primary" />
              <span className="font-medium">Meus Grupos</span>
            </Link>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleSignOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-zinc-800 rounded-lg transition-colors border-t border-zinc-700"
            >
              <LogOut size={22} className="text-primary" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
