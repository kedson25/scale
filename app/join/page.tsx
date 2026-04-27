'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { scaleService, Team, UserProfile } from '@/lib/services/scaleService';
import { Loader2, Users, CheckCircle2, AlertTriangle, LogIn } from 'lucide-react';
import Link from 'next/link';

function JoinTeamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const teamId = searchParams.get('teamId');

  const [loading, setLoading] = React.useState(true);
  const [team, setTeam] = React.useState<Team | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [error, setError] = React.useState('');
  const [joining, setJoining] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!teamId) {
      setError('Link de convite inválido ou ausente.');
      setLoading(false);
      return;
    }

    const fetchTeamAndUser = async (user: any) => {
      try {
        const teamData = await scaleService.getTeamById(teamId);
        if (!teamData) {
          setError('Equipe não encontrada ou link expirado.');
          setLoading(false);
          return;
        }
        setTeam(teamData);

        if (user) {
          const users = await scaleService.getUsers();
          const profile = users.find(u => u.uid === user.uid);
          if (profile) {
            setUserProfile(profile);
            if (profile.teamId === teamId) {
              setSuccess(true);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching data", err);
        setError('Erro ao carregar informações do convite.');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      fetchTeamAndUser(user);
    });

    return () => unsubscribe();
  }, [teamId]);

  const handleJoinTeam = async () => {
    if (!userProfile || !teamId) return;
    setJoining(true);
    try {
      await scaleService.updateUserProfile(userProfile.uid, { teamId });
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error("Error joining team", err);
      setError('Erro ao entrar na equipe. Tente novamente.');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 size={48} className="animate-spin text-blue-600" />
          <p className="font-medium">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ops! Algo deu errado</h1>
          <p className="text-slate-500 mb-8">{error}</p>
          <Link href="/" className="inline-block w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
            Voltar para o Início
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo à equipe!</h1>
          <p className="text-slate-500 mb-8">Você agora faz parte da equipe <strong className="text-slate-900">{team?.name}</strong>.</p>
          <p className="text-sm text-slate-400 animate-pulse">Redirecionando para o seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 text-center bg-blue-600 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 backdrop-blur-sm border border-white/30">
              <Users size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Convite para Equipe</h1>
            <p className="text-blue-100 text-sm">Você foi convidado para participar do Ecooy</p>
          </div>
        </div>

        <div className="p-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-2">{team?.name}</h2>
          {team?.description && (
            <p className="text-slate-500 text-sm mb-8">{team.description}</p>
          )}
          
          {!team?.description && <div className="h-8"></div>}

          {userProfile ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                <p className="text-sm text-slate-600">Entrando como:</p>
                <p className="font-bold text-slate-900">{userProfile.name}</p>
                <p className="text-xs text-slate-500">{userProfile.email}</p>
              </div>
              
              <button 
                onClick={handleJoinTeam}
                disabled={joining}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {joining ? (
                  <><Loader2 size={20} className="animate-spin" /> Entrando...</>
                ) : (
                  <><Users size={20} /> Participar da Equipe</>
                )}
              </button>
              
              <Link href="/" className="inline-block w-full py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors text-sm">
                Cancelar
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-600 mb-6">Para aceitar o convite, você precisa fazer login ou criar uma conta.</p>
              
              <Link 
                href={`/login?redirect=/join?teamId=${teamId}`} 
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                <LogIn size={20} /> Fazer Login / Cadastrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JoinTeamPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><Loader2 size={48} className="animate-spin text-blue-600" /></div>}>
      <JoinTeamContent />
    </Suspense>
  );
}
