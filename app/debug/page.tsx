'use client';

import { useSession } from 'next-auth/react';

export default function DebugPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug - Session Info</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Status</h2>
          <div className="space-y-2">
            <p>
              <strong>Status:</strong>
              <span
                className={`ml-2 px-3 py-1 rounded text-white ${
                  status === 'authenticated'
                    ? 'bg-green-600'
                    : status === 'loading'
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                }`}
              >
                {status}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Session Object</h2>
          {session ? (
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto">
              <pre>{JSON.stringify(session, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-gray-600">Nenhuma sessão ativa</p>
          )}
        </div>

        <div className="mt-8">
          <a href="/login" className="text-blue-600 hover:text-blue-800 underline">
            ← Voltar para Login
          </a>
        </div>
      </div>
    </div>
  );
}
