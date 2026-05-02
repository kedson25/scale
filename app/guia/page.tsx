'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  PlusCircle, 
  UserPlus, 
  ArrowRight, 
  CheckCircle2,
  ChevronLeft,
  Menu,
  X,
  BookOpen,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';

interface Step {
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
}

interface Module {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  steps: Step[];
}

const modules: Module[] = [
  {
    id: 'equipes-usuarios',
    title: "Como Criar uma Equipe e Adicionar um Usuário",
    subtitle: "Módulo 1: Gestão de Acessos",
    description: "Siga este guia prático para configurar sua primeira estrutura de equipe no Ecooy e começar a gerenciar seus colaboradores com eficiência.",
    steps: [
      {
        title: "Passo 1 — Acessar Equipes",
        description: "No menu lateral, clique em Equipes para acessar a área de gerenciamento de equipes do sistema.",
        image: "https://gaocipthqhvsmcomfgcr.supabase.co/storage/v1/object/public/eco/como%20criar%20acessos%201/imagens%20guia%20ecooy%201.png",
        icon: <Users className="w-5 h-5" />,
      },
      {
        title: "Passo 2 — Nova Equipe",
        description: "Na tela de equipes, clique no botão Nova Equipe, localizado no canto superior direito da tela.",
        image: "https://gaocipthqhvsmcomfgcr.supabase.co/storage/v1/object/public/eco/como%20criar%20acessos%201/imagens%20guia%20ecooy%202.png",
        icon: <PlusCircle className="w-5 h-5" />,
      },
      {
        title: "Passo 3 — Criar Equipe",
        description: "Insira um nome para identificar a sua equipe e clique em Criar Equipe para confirmá-la.",
        image: "https://gaocipthqhvsmcomfgcr.supabase.co/storage/v1/object/public/eco/como%20criar%20acessos%201/imagens%20guia%20ecooy%203.png",
        icon: <CheckCircle2 className="w-5 h-5" />,
      },
      {
        title: "Passo 4 — Acessar Usuários",
        description: "Com a equipe criada com sucesso, agora acesse a seção Usuários no menu lateral para começar a adicionar membros.",
        image: "https://gaocipthqhvsmcomfgcr.supabase.co/storage/v1/object/public/eco/como%20criar%20acessos%201/imagens%20guia%20ecooy%204.png",
        icon: <Users className="w-5 h-5" />,
      },
      {
        title: "Passo 5 — Cadastrar Usuário",
        description: "Na tela de usuários, clique em Cadastrar Usuário para iniciar o processo de inclusão de um novo membro.",
        image: "https://gaocipthqhvsmcomfgcr.supabase.co/storage/v1/object/public/eco/como%20criar%20acessos%201/imagens%20guia%20ecooy%205.png",
        icon: <UserPlus className="w-5 h-5" />,
      },
      {
        title: "Passo 6 — Preencher Dados",
        description: "Preencha os dados do usuário nos campos disponíveis, como nome, e-mail e demais informações solicitadas.",
        image: "https://gaocipthqhvsmcomfgcr.supabase.co/storage/v1/object/public/eco/como%20criar%20acessos%201/imagens%20guia%20ecooy66.png",
        icon: <ArrowRight className="w-5 h-5" />,
      },
      {
        title: "Passo 7 — Vincular Equipe",
        description: "⚠️ Importante: Antes de finalizar, certifique-se de vincular o novo usuário à equipe que você acabou de criar. Sem esse vínculo, o usuário não terá acesso às configurações e permissões corretas.",
        image: "https://gaocipthqhvsmcomfgcr.supabase.co/storage/v1/object/public/eco/como%20criar%20acessos%201/imagens%20guia%20ecooy%207.png",
        icon: <CheckCircle2 className="w-5 h-5" />,
      },
      {
        title: "Passo 8 — Finalizar Cadastro",
        description: "Por fim, clique em Cadastrar Usuário para salvar. Pronto! Sua equipe está configurada e o primeiro usuário já foi adicionado com sucesso.",
        image: "https://gaocipthqhvsmcomfgcr.supabase.co/storage/v1/object/public/eco/como%20criar%20acessos%201/imagens%20guia%20ecooy%208.png",
        icon: <CheckCircle2 className="w-5 h-5" />,
      }
    ]
  }
];

export default function GuiaPage() {
  const [activeModule, setActiveModule] = useState(modules[0]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      {/* Sidebar Content - Always Visible */}
      <aside
        className="fixed top-0 left-0 bottom-0 w-80 bg-white border-r border-slate-200 z-50 p-6 overflow-y-auto"
      >
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Módulos</h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Documentação</p>
          </div>
        </div>

        <nav className="space-y-4">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => {
                setActiveModule(mod);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-full text-left p-4 rounded-2xl transition-all border ${
                activeModule.id === mod.id 
                  ? 'bg-blue-50 border-blue-100 shadow-sm' 
                  : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${
                activeModule.id === mod.id ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {mod.subtitle}
              </span>
              <span className={`font-bold text-sm leading-tight block ${
                activeModule.id === mod.id ? 'text-slate-900' : 'text-slate-600'
              }`}>
                {mod.title}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-80 pb-20">
        {/* Navigation Header */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-900 tracking-tight">Ecooy Guide</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Documentação Ativa</span>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center overflow-hidden">
          <motion.div
             key={activeModule.id}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
          >
            <span className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mb-4 block">
              {activeModule.subtitle}
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              {activeModule.title}
            </h1>
            <p className="max-w-2xl mx-auto text-slate-500 text-lg leading-relaxed italic">
              {activeModule.description}
            </p>
          </motion.div>
        </header>

        {/* Steps List */}
        <main className="max-w-4xl mx-auto px-6 space-y-24">
          {activeModule.steps.map((step, index) => (
            <motion.section 
              key={`${activeModule.id}-step-${index}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex flex-col gap-8"
              id={`step-${index + 1}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-none w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  {step.icon}
                </div>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-slate-300 font-black text-4xl select-none">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="grid md:grid-cols-1 gap-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {step.title}
                  </h2>
                  <div className="text-slate-600 leading-relaxed text-lg border-l-4 border-blue-500/10 pl-6 py-2 bg-blue-50/50 rounded-r-2xl">
                    {step.description}
                  </div>
                </div>
                
                <div className="relative group overflow-hidden rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/60 bg-white">
                  <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-colors duration-500 z-10" />
                  <Image 
                    src={step.image} 
                    alt={step.title}
                    width={920}
                    height={610}
                    className="w-full h-auto object-cover transform group-hover:scale-[1.015] transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </motion.section>
          ))}
        </main>

        {/* Footer CTA */}
        <footer className="max-w-3xl mx-auto px-6 mt-32 text-center">
          <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -z-0" />
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-4">Módulo concluído!</h3>
              <p className="text-slate-400 mb-0 max-w-md mx-auto">
                Agora que você aprendeu o básico deste módulo, pode explorar as funcionalidades no painel administrativo.
              </p>
            </div>
          </div>
          <p className="mt-12 text-slate-400 text-sm font-medium">
            Ecooy © 2026 • Sistema de Guia Interativo
          </p>
        </footer>
      </div>
    </div>
  );
}
