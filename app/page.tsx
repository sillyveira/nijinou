import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogIn, UserPlus } from "lucide-react";

export default async function Home() {
  const session = await auth();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-secondary">
      {/* Background image com blur */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center z-0"
        style={{
          backgroundImage:
            'url(https://www.desktophut.com/images/1823_mpc-hc64_PPiciLC6eA.jpg)',
          filter: 'blur(8px) brightness(0.5)',
        }}
        aria-hidden="true"
      />

      {/* Conteúdo centralizado */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-4">
        <h1 className="text-6xl md:text-7xl font-extrabold uppercase text-white drop-shadow-2xl tracking-widest mb-4 text-center">
          NIJINOU
        </h1>
        <h2 className="text-xl md:text-3xl font-medium text-zinc-300 mb-12 drop-shadow-lg text-center">
          o segundo cérebro
        </h2>
        <div className="flex gap-6 flex-wrap justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-primary-light text-white text-lg font-semibold shadow-lg transition-colors duration-200"
          >
            <LogIn size={22} /> Login
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-2 px-8 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-lg font-semibold shadow-lg transition-colors duration-200 border border-zinc-600"
          >
            <UserPlus size={22} /> Registro
          </Link>
        </div>
      </div>
    </div>
  );
}
