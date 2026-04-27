'use client';

import Image from 'next/image';
import React, { Suspense } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, Lock, Mail, Loader2, User } from 'lucide-react';
import { scaleService } from '@/lib/services/scaleService';

function LoginForm() {
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !isRegistering) {
        // Check user profile in Firestore to redirect correctly
        try {
          const users = await scaleService.getUsers();
          const profile = users.find(u => u.uid === user.uid);
          
          if (redirectUrl) {
            router.push(redirectUrl);
            return;
          }

          if (profile?.isadmin === true) {
            router.push('/admin');
          } else {
            router.push('/');
          }
        } catch (err) {
          console.error("Error fetching profile", err);
          router.push(redirectUrl || '/');
        }
      }
    });
    return () => unsubscribe();
  }, [router, isRegistering, redirectUrl]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await scaleService.createUserProfile({
          uid: user.uid,
          email: email,
          name: name,
          role: 'collaborator',
          isadmin: false,
          createdAt: Date.now()
        });
        
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push('/');
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(isRegistering ? 'Erro ao criar conta. Verifique os dados.' : 'E-mail ou senha inválidos.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 text-center bg-blue-600 text-white">
          <div className="inline-flex items-center justify-center p-1 rounded-xl mb-1">
            <Image
              src="https://gaocipthqhvsmcomfgcr.supabase.co/storage/v1/object/public/eco/logo.png"
              alt="ecooy logo"
              width={100}
              height={100}
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-bold">ecooy</h1>
          <p className="text-blue-100 text-sm mt-1">Gestão Inteligente de Escalas</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleAuth} className="space-y-6">
            {isRegistering && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-lg">
                {error}
              </div>
            )}

            <button 
              disabled={loading}
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {isRegistering ? 'Criando conta...' : 'Entrando...'}
                </>
              ) : (
                isRegistering ? 'Criar Minha Conta' : 'Entrar no Sistema'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-xs font-medium">
        © 2024 ecooy. Todos os direitos reservados.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><Loader2 size={48} className="animate-spin text-blue-600" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
