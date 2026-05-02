'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollText, CheckCircle2, LogOut, ChevronDown } from 'lucide-react';
import { auth, getDb } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  userId: string;
}

export default function TermsModal({ isOpen, onAccept, userId }: TermsModalProps) {
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // If we are within 20px of the bottom, consider it read
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setHasReadToBottom(true);
      }
    }
  };

  const handleAccept = async () => {
    if (!hasAgreed || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const db = getDb();
      const userRef = doc(db, 'scale', `user_${userId}`);
      await setDoc(userRef, {
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString()
      }, { merge: true });
      onAccept();
    } catch (error) {
      console.error("Erro ao aceitar termos:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecline = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <ScrollText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Termos e Condições</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ecooy • Gestão de Escalas</p>
          </div>
        </div>

        {/* Content */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none scroll-smooth"
        >
          <div className="space-y-6 text-slate-600">
            <div className="text-center pb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">ECOOY</h3>
              <p className="text-sm font-medium">Aplicativo de Gestão de Escalas de Trabalho</p>
              <p className="font-black text-slate-900">TERMOS E CONDIÇÕES DE USO</p>
            </div>

            <section>
              <h4 className="text-slate-900 font-bold">1. Aceitação dos Termos</h4>
              <p className="text-sm leading-relaxed">
                Ao acessar ou utilizar o aplicativo Ecooy, você declara que leu, compreendeu e concorda com estes Termos e Condições de Uso (&quot;Termos&quot;). Se você não concordar com alguma disposição aqui presente, não utilize o aplicativo.
                Estes Termos constituem um contrato legal entre você (&quot;Usuário&quot;) e a Ecooy (&quot;Empresa&quot;), aplicando-se a todos os usuários da plataforma, incluindo administradores, gestores e colaboradores.
              </p>
            </section>

            <section>
              <h4 className="text-slate-900 font-bold">2. Descrição do Serviço</h4>
              <p className="text-sm leading-relaxed">
                O Ecooy é uma plataforma digital para gestão e organização de escalas de trabalho, que oferece as seguintes funcionalidades:
              </p>
              <ul className="text-sm space-y-1 list-disc pl-5">
                <li>Criação e gerenciamento de equipes e grupos de trabalho</li>
                <li>Montagem, publicação e controle de escalas de plantões e turnos</li>
                <li>Cadastro e administração de usuários e colaboradores</li>
                <li>Notificações e alertas sobre mudanças na escala</li>
                <li>Relatórios e histórico de jornadas de trabalho</li>
                <li>Controle de ausências, folgas e substituições</li>
              </ul>
              <p className="text-sm mt-2">A Ecooy reserva-se o direito de modificar, suspender ou encerrar funcionalidades a qualquer momento, visando a melhoria contínua do serviço.</p>
            </section>

            <section>
              <h4 className="text-slate-900 font-bold">3. Cadastro e Conta de Usuário</h4>
              <p className="text-sm font-bold mt-2">3.1 Requisitos de Cadastro</p>
              <p className="text-sm leading-relaxed">Para utilizar o Ecooy, é necessário realizar um cadastro fornecendo informações verdadeiras, precisas e completas. O Usuário é responsável por manter seus dados atualizados.</p>
              <p className="text-sm font-bold mt-2">3.2 Credenciais de Acesso</p>
              <p className="text-sm leading-relaxed">O Usuário é o único responsável pela confidencialidade de suas credenciais de acesso (login e senha). Qualquer atividade realizada com suas credenciais será de sua inteira responsabilidade. Em caso de suspeita de uso não autorizado, o Usuário deve comunicar imediatamente a Ecooy.</p>
              <p className="text-sm font-bold mt-2">3.3 Criação de Equipes e Adição de Usuários</p>
              <p className="text-sm leading-relaxed">Administradores e gestores podem criar equipes e adicionar usuários à plataforma. Ao cadastrar um colaborador, o responsável declara ter autorização para incluir os dados desse indivíduo no sistema, em conformidade com a legislação aplicável.</p>
            </section>

            <section>
              <h4 className="text-slate-900 font-bold">4. Uso Aceitável da Plataforma</h4>
              <p className="text-sm leading-relaxed">
                O Usuário compromete-se a utilizar o Ecooy exclusivamente para fins lícitos e relacionados à gestão de escalas de trabalho. São expressamente proibidas as seguintes condutas:
              </p>
              <ul className="text-sm space-y-1 list-disc pl-5">
                <li>Fornecer informações falsas, enganosas ou fraudulentas</li>
                <li>Utilizar o aplicativo para fins ilegais ou em desacordo com a legislação trabalhista vigente</li>
                <li>Compartilhar credenciais de acesso com terceiros não autorizados</li>
                <li>Tentar acessar áreas restritas ou dados de outros usuários sem autorização</li>
                <li>Realizar engenharia reversa, copiar ou reproduzir o código-fonte da plataforma</li>
                <li>Inserir vírus, malware ou qualquer código malicioso no sistema</li>
                <li>Sobrecarregar intencionalmente os servidores da plataforma</li>
              </ul>
            </section>

            <section>
              <h4 className="text-slate-900 font-bold">5. Privacidade e Proteção de Dados</h4>
              <p className="text-sm font-bold mt-2">5.1 Dados Coletados</p>
              <p className="text-sm leading-relaxed">O Ecooy coleta e processa dados necessários para o funcionamento da plataforma, incluindo dados cadastrais dos usuários (nome, e-mail, cargo), informações de escalas e jornadas, e registros de acesso e uso do sistema.</p>
              <p className="text-sm font-bold mt-2">5.2 Finalidade do Tratamento</p>
              <p className="text-sm leading-relaxed">Os dados coletados são utilizados exclusivamente para prestação dos serviços contratados, melhoria da plataforma, suporte ao usuário e cumprimento de obrigações legais.</p>
              <p className="text-sm font-bold mt-2">5.3 Lei Geral de Proteção de Dados (LGPD)</p>
              <p className="text-sm leading-relaxed">O Ecooy está em conformidade com a Lei nº 13.709/2018 (LGPD). Os dados pessoais tratados pela plataforma são protegidos por medidas técnicas e administrativas adequadas. O Usuário tem direito a acessar, corrigir, portar, anonimizar ou solicitar a exclusão de seus dados pessoais, conforme previsto na legislação.</p>
              <p className="text-sm font-bold mt-2">5.4 Compartilhamento de Dados</p>
              <p className="text-sm leading-relaxed">A Ecooy não vende, aluga ou comercializa dados pessoais de seus usuários. O compartilhamento de informações ocorre apenas quando exigido por lei ou com parceiros técnicos estritamente necessários à operação do serviço, sob obrigações de confidencialidade.</p>
            </section>

            <section>
              <h4 className="text-slate-900 font-bold">6. Planos e Pagamentos</h4>
              <p className="text-sm leading-relaxed">O Ecooy pode oferecer planos gratuitos e pagos. As condições específicas de cada plano, incluindo preços, limites de usuários e funcionalidades disponíveis, são descritas no momento da contratação.</p>
              <p className="text-sm mt-2 leading-relaxed">Em caso de planos pagos, o cancelamento deve ser realizado dentro do prazo estipulado no plano contratado. Valores já pagos não são reembolsáveis, salvo disposição legal em contrário ou acordo expresso com a Ecooy.</p>
            </section>

            <section>
              <h4 className="text-slate-900 font-bold">7. Propriedade Intelectual</h4>
              <p className="text-sm leading-relaxed">Todo o conteúdo da plataforma Ecooy — incluindo logotipo, marca, interfaces, código-fonte, textos, ícones e demais elementos — é de propriedade exclusiva da Ecooy e está protegido pelas leis de propriedade intelectual vigentes.</p>
              <p className="text-sm mt-2 leading-relaxed">É concedida ao Usuário uma licença limitada, não exclusiva, intransferível e revogável para utilização da plataforma, exclusivamente para os fins previstos nestes Termos. Qualquer uso não autorizado é expressamente proibido.</p>
            </section>

            <section>
              <h4 className="text-slate-900 font-bold">8. Disponibilidade e Manutenção</h4>
              <p className="text-sm leading-relaxed">A Ecooy envidará seus melhores esforços para manter a plataforma disponível de forma contínua. No entanto, não garante disponibilidade ininterrupta, podendo haver interrupções programadas para manutenção, atualizações ou por razões fora do controle da Empresa.</p>
            </section>

            <section>
              <h4 className="text-slate-900 font-bold">9. Limitação de Responsabilidade</h4>
              <p className="text-sm leading-relaxed">A Ecooy não se responsabiliza por danos decorrentes do uso indevido, perdas resultantes de falhas de conexão, decisões trabalhistas tomadas com base nas informações do sistema ou dados inseridos incorretamente.</p>
              <p className="text-sm mt-2 leading-relaxed">O Usuário é responsável pelo uso adequado das informações geradas pela plataforma, sendo a Ecooy uma ferramenta de apoio à gestão, sem substituir a responsabilidade do empregador perante a legislação trabalhista.</p>
            </section>

            <section>
              <h4 className="text-slate-900 font-bold">10. Suspensão e Rescisão</h4>
              <p className="text-sm leading-relaxed">A Ecooy poderá suspender ou encerrar o acesso do Usuário em caso de violação destes Termos, uso ilegal/fraudulento, inadimplência ou solicitação expressa do Usuário ou empresa contratante.</p>
            </section>

            <section>
              <h4 className="text-slate-900 font-bold">11. Alterações nestes Termos</h4>
              <p className="text-sm leading-relaxed">A Ecooy reserva-se o direito de atualizar estes Termos a qualquer momento. As alterações serão comunicadas e o uso continuado implica a aceitação dos novos Termos.</p>
            </section>

            <section>
              <h4 className="text-slate-900 font-bold">12. Legislação Aplicável e Foro</h4>
              <p className="text-sm leading-relaxed">Estes Termos são regidos pelas leis da República Federativa do Brasil. Eventuais disputas serão submetidas ao Foro da Comarca da sede da Empresa.</p>
            </section>

            <div className="pt-10 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium">Ao utilizar o Ecooy, você confirma que leu e aceita integralmente estes Termos e Condições.</p>
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">© 2025 Ecooy — Todos os direitos reservados.</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 space-y-6">
          {!hasReadToBottom && (
            <div className="flex items-center justify-center gap-2 text-blue-600 animate-bounce pb-2">
              <ChevronDown className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Role para ler até o fim</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
            <label className={`flex items-center gap-3 cursor-pointer group transition-opacity flex-1 ${!hasReadToBottom ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div className="relative flex items-center justify-center flex-none">
                <input 
                  type="checkbox" 
                  className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:border-blue-600 checked:bg-blue-600 transition-all cursor-pointer"
                  checked={hasAgreed}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  disabled={!hasReadToBottom}
                />
                <CheckCircle2 className="absolute w-3.5 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors leading-tight">
                Estou ciente e concordo com todos os Termos e Condições
              </span>
            </label>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <button 
                onClick={handleDecline}
                className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 hover:text-red-500 hover:border-red-100 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Recusar
              </button>
              <button 
                onClick={handleAccept}
                disabled={!hasAgreed || isUpdating}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg whitespace-nowrap ${
                  hasAgreed && !isUpdating 
                    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-200/30 hover:scale-[1.02]' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isUpdating ? 'Salvando...' : 'Concordar e Continuar'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
