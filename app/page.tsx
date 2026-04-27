'use client';

import React from 'react';
import { 
  User,
  Users,
  Bell, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  CalendarOff,
  CheckCircle2,
  LogOut,
  Loader2,
  Mail,
  Calendar as CalendarIcon,
  Trash2,
  Clock,
  Camera,
  Edit,
  Check,
  X,
  Phone,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import MobileNav from '@/components/MobileNav';
import ProfilePictureUploader from '@/components/ProfilePictureUploader';
import { getDaysForWeek, getCurrentWeekNumber, getWeeksInMonth } from '@/lib/dateUtils';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import { scaleService, UserProfile, Team, Alert } from '@/lib/services/scaleService';
import { useRouter } from 'next/navigation';

export default function MobileCollaboratorView() {
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [team, setTeam] = React.useState<Team | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingStep, setLoadingStep] = React.useState('Iniciando...');
  const [mounted, setMounted] = React.useState(false);
  const [dataReady, setDataReady] = React.useState({
    profile: false,
    alerts: false,
    users: false
  });
  const [selectedWeek, setSelectedWeek] = React.useState(getCurrentWeekNumber());
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const router = useRouter();

  const currentWeek = React.useMemo(() => getCurrentWeekNumber(), []);
  const [activeTab, setActiveTab] = React.useState<'home' | 'escala' | 'avisos' | 'perfil'>('home');
  const [showWhatsAppModal, setShowWhatsAppModal] = React.useState(false);
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState('');
  const [isScaleVisible, setIsScaleVisible] = React.useState(true);
  const [whatsapp, setWhatsapp] = React.useState('');
  const [savingWhatsApp, setSavingWhatsApp] = React.useState(false);
  const [isEditingWhatsApp, setIsEditingWhatsApp] = React.useState(false);
  const [editingPhoto, setEditingPhoto] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<UserProfile[]>([]);

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    let formatted = value;
    if (value.length > 0) {
      if (value.length <= 2) {
        formatted = `(${value}`;
      } else if (value.length <= 7) {
        formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else {
        formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
      }
    }
    setWhatsapp(formatted);
  };

  const currentDaysOfWeek = React.useMemo(() => getDaysForWeek(selectedWeek), [selectedWeek]);

  // Calculate unread alerts
  const unreadCount = React.useMemo(() => {
    if (!userProfile) return 0;
    return alerts.filter(a => !a.readBy?.includes(userProfile.uid)).length;
  }, [alerts, userProfile]);

  const [currentMonth, setCurrentMonth] = React.useState('');

  React.useEffect(() => {
    if (dataReady.profile && dataReady.alerts && dataReady.users) {
      setLoading(false);
    }
  }, [dataReady]);

  React.useEffect(() => {
    setMounted(true);
    setSelectedWeek(getCurrentWeekNumber());
    setCurrentMonth(new Date().toLocaleString('pt-BR', { month: 'long' }));
    setLoadingStep('Verificando sessão...');
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setLoadingStep('Carregando perfil...');

      try {
        const unsubUser = scaleService.subscribeToUserProfile(user.uid, (profile) => {
          if (profile) {
            setUserProfile(prev => {
              if (prev === null) {
                // First load
                if (!profile.whatsapp) {
                  setShowWhatsAppModal(true);
                }
                
                if (profile.forcePasswordChange) {
                    setShowPasswordModal(true);
                }
                
                setLoadingStep('Carregando equipe...');
                const handleProfileLoad = async () => {
                  if (profile.teamId) {
                    const userTeam = await scaleService.getTeamById(profile.teamId);
                    if (userTeam) setTeam(userTeam);
                  }
                  setDataReady(prev => ({ ...prev, profile: true }));
                };
                
                handleProfileLoad();
              } else {
                // Subsequent updates
                setDataReady(prev => ({ ...prev, profile: true }));
              }
              return profile;
            });
          }
        });

        // Subscribe to alerts
        const unsubAlerts = scaleService.subscribeToAlerts(user.uid, undefined, (newAlerts) => {
          setAlerts(newAlerts);
          setDataReady(prev => ({ ...prev, alerts: true }));
        });

        // Subscribe to all users to resolve names
        const unsubUsers = scaleService.subscribeToUsers((newUsers) => {
          setUsers(newUsers);
          setDataReady(prev => ({ ...prev, users: true }));
        });

        return () => {
          unsubUser();
          unsubAlerts();
          unsubUsers();
        };
      } catch (err) {
        console.error("Error setting up subscriptions", err);
        setLoading(false); // Fallback to show whatever we have or error screen
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  const saveWhatsApp = async () => {
    if (!userProfile) return;
    setSavingWhatsApp(true);
    try {
      await scaleService.updateUserProfile(userProfile.uid, { whatsapp });
      setUserProfile({...userProfile, whatsapp});
      setShowWhatsAppModal(false);
    } catch (e) {
      alert("Erro ao salvar WhatsApp.");
    } finally {
      setSavingWhatsApp(false);
    }
  };

  // Mark alerts as read when opening the avisos tab
  React.useEffect(() => {
    if (activeTab === 'avisos' && userProfile && unreadCount > 0) {
      const unreadAlerts = alerts.filter(a => !a.readBy?.includes(userProfile.uid));
      unreadAlerts.forEach(alert => {
        if (alert.id) {
          scaleService.markAlertAsRead(alert.id, userProfile.uid);
        }
      });
    }
  }, [activeTab, userProfile, alerts, unreadCount]);

  const user = userProfile;
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  const todayFullDate = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }, []);

  const currentShifts = React.useMemo(() => (user ? currentDaysOfWeek.map(day => ({
    ...day,
    shift: (user as any).shifts ? (user as any).shifts[day.fullDate] : null,
    lunchShift: (user as any).lunchShifts ? (user as any).lunchShifts[day.fullDate] : null
  })) : []), [user, currentDaysOfWeek]);

  const handlePrevWeek = () => {
    setSelectedWeek(prev => prev > 1 ? prev - 1 : 5);
  };

  const handleNextWeek = () => {
    setSelectedWeek(prev => prev < 5 ? prev + 1 : 1);
  };

  const nextDayOff = React.useMemo(() => {
    if (!user) return null;
    
    // Check weeks 1 to 5 for the next day off starting from today
    const allDays: any[] = [];
    for (let w = 1; w <= 5; w++) {
      const weekDays = getDaysForWeek(w);
      allDays.push(...weekDays.map(d => ({ ...d, weekNumber: w })));
    }

    // Sort uniquely by date to avoid any overlaps and find the first index
    const sortedDays = allDays.sort((a, b) => a.fullDate.localeCompare(b.fullDate));
    // Remove duplicates if any (though getDaysForWeek should be clean)
    const uniqueDays = sortedDays.filter((v, i, a) => a.findIndex(t => t.fullDate === v.fullDate) === i);

    const firstOffIndex = uniqueDays.findIndex(day => {
      if (day.fullDate < todayFullDate) return false;
      const shift = (user as any).shifts ? (user as any).shifts[day.fullDate] : null;
      return shift?.type === 'DSR' || shift?.type === 'FALTA';
    });

    if (firstOffIndex === -1) return null;

    const offBlock = [uniqueDays[firstOffIndex]];
    
    // Check for consecutive days off
    for (let i = firstOffIndex + 1; i < uniqueDays.length; i++) {
      const day = uniqueDays[i];
      const shift = (user as any).shifts ? (user as any).shifts[day.fullDate] : null;
      if (shift?.type === 'DSR' || shift?.type === 'FALTA') {
        offBlock.push(day);
      } else {
        break;
      }
    }

    return {
      ...offBlock[0],
      shift: (user as any).shifts[offBlock[0].fullDate],
      allDaysInBlock: offBlock,
      weekNumber: offBlock[0].weekNumber
    };
  }, [user, todayFullDate]);

  const isOffToday = React.useMemo(() => nextDayOff?.fullDate === todayFullDate, [nextDayOff, todayFullDate]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-slate-50 overflow-x-hidden sm:max-w-md sm:mx-auto sm:border-x border-slate-200">
        <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-slate-200">
          <div className="flex items-center p-4 justify-between sm:max-w-md sm:mx-auto w-full">
            <div className="size-10 rounded-full bg-slate-100 animate-pulse"></div>
            <div className="flex-1 px-3 space-y-2">
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
              <div className="h-3 w-16 bg-slate-50 rounded animate-pulse"></div>
            </div>
            <div className="size-10 rounded-xl bg-slate-100 animate-pulse"></div>
          </div>
        </div>
        
        <div className="pt-24 px-4 space-y-6">
          <div className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
          <div className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
          <div className="h-40 bg-white rounded-2xl border border-slate-100 animate-pulse shadow-sm"></div>
          <div className="space-y-3">
             <div className="h-3 w-32 bg-slate-200/50 rounded animate-pulse"></div>
             <div className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
             <div className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
          <div className="flex justify-around sm:max-w-md sm:mx-auto">
            <div className="size-12 rounded-xl bg-slate-50 animate-pulse"></div>
            <div className="size-12 rounded-xl bg-slate-50 animate-pulse"></div>
            <div className="size-12 rounded-xl bg-slate-50 animate-pulse"></div>
            <div className="size-12 rounded-xl bg-slate-50 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }


  const renderContent = () => {
    if (activeTab === 'home') {
      return (
        <div className="p-4 space-y-6 pb-24">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Semana {selectedWeek}</h2>
            <p className="text-slate-500 text-sm mb-4">
              {mounted ? `${currentDaysOfWeek[0].date} a ${currentDaysOfWeek[6].date} de ${currentMonth}` : 'Carregando...'}
            </p>
            <button 
              onClick={() => setActiveTab('escala')}
              className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
            >
              Ver Escala Completa
            </button>
          </div>

          {(user as any)?.defaultLunchTime && (
             <div className="bg-indigo-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
               <div className="flex items-center gap-3 mb-2">
                 <Clock size={20} className="text-indigo-600" />
                 <h2 className="text-sm font-bold text-indigo-900 uppercase">Horário de Almoço</h2>
               </div>
               <p className="text-2xl font-black text-indigo-700">{(user as any)?.defaultLunchTime}</p>
             </div>
          )}

          {alerts.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Último Recado</h3>
               <p className="text-sm font-bold text-slate-900 mb-1">{alerts[0].title}</p>
               <p className="text-sm text-slate-600 line-clamp-2">{alerts[0].message}</p>
               <button onClick={() => setActiveTab('avisos')} className="mt-4 text-xs font-black text-blue-600">Ler aviso →</button>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-sm text-white">
            <div className="flex items-center gap-3 mb-4">
              <CalendarOff size={24} className="text-blue-100" />
              <h2 className="text-lg font-bold">
                {isOffToday 
                  ? (nextDayOff?.shift?.type === 'FALTA' ? 'Você tem uma ausência hoje' : 'Você está de folga hoje!') 
                  : (nextDayOff?.shift?.type === 'FALTA' ? 'Próxima Ausência' : 'Próxima Folga')}
              </h2>
            </div>
                     {nextDayOff ? (
              <div>
                <p className="text-4xl font-bold mb-1">
                  {nextDayOff.allDaysInBlock && nextDayOff.allDaysInBlock.length > 1 
                    ? `${nextDayOff.allDaysInBlock[0].date} a ${nextDayOff.allDaysInBlock[nextDayOff.allDaysInBlock.length - 1].date}`
                    : nextDayOff.date}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-blue-100 text-sm font-medium uppercase">
                    {nextDayOff.allDaysInBlock && nextDayOff.allDaysInBlock.length > 1
                      ? `${nextDayOff.allDaysInBlock[0].name} a ${nextDayOff.allDaysInBlock[nextDayOff.allDaysInBlock.length - 1].name}`
                      : nextDayOff.name}
                  </p>
                  {(nextDayOff as any).weekNumber !== currentWeek && (
                    <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      Semana {(nextDayOff as any).weekNumber}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-blue-100 text-sm">Nenhuma folga ou falta programada nos próximos registros.</p>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'perfil') {
      if (!user) return null;
      return (
        <div className="p-4 space-y-6 pb-24">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
            <div className="size-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
              <User size={40} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-slate-500 text-sm mb-6">{user.role === 'admin' ? 'Administrador' : 'Colaborador'}</p>
            
            <div className="space-y-3 text-left">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</span>
                <span className="text-sm font-medium text-slate-900">{user.email}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Equipe</span>
                <span className="text-sm font-medium text-slate-900">{team ? team.name : 'Sem Equipe'}</span>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp</span>
                {isEditingWhatsApp ? (
                  <div className="flex gap-2 items-center">
                    <input 
                      type="tel"
                      value={whatsapp}
                      onChange={handleWhatsAppChange}
                      className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
                      placeholder="(00) 00000-0000"
                      autoFocus
                    />
                    <button 
                      onClick={async () => {
                        await saveWhatsApp();
                        setIsEditingWhatsApp(false);
                      }}
                      disabled={savingWhatsApp}
                      className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      {savingWhatsApp ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingWhatsApp(false);
                        setWhatsapp(user.whatsapp || '');
                      }}
                      className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-green-500" />
                      <span className="text-sm font-medium text-slate-900">{user.whatsapp || 'Não informado'}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setWhatsapp(user.whatsapp || '');
                        setIsEditingWhatsApp(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full py-4 text-sm font-black text-blue-600 bg-blue-50 rounded-2xl"
              >
                Trocar Senha
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'avisos') {
      return (
        <div className="p-4 space-y-6 pb-24">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meus Avisos</h3>
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {alerts.length} recados
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <Mail size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium text-sm">Nenhum aviso no momento.</p>
            </div>
          ) : (
              <div className="space-y-4">
                {alerts.map((alert) => {
                  const isScaleAlert = alert.title.toLowerCase().includes('escala');
                  return (
                    <div key={alert.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden group hover:border-blue-300 transition-all">
                      <div className={`absolute top-0 left-0 w-1 h-full ${isScaleAlert ? 'bg-green-500' : 'bg-blue-600'}`}></div>
                      
                      {!alert.readBy?.includes(userProfile?.uid || '') && (
                        <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                      )}
                      
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${isScaleAlert ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isScaleAlert ? <CalendarIcon size={16} /> : <Bell size={16} />}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                            {alert.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {alert.message}
                      </p>
                      
                      {isScaleAlert && (
                        <div className="pt-2 flex items-center justify-between">
                          <button 
                            onClick={() => setActiveTab('escala')}
                            className="text-[10px] font-bold text-green-600 hover:text-green-700 flex items-center gap-1 uppercase tracking-wider"
                          >
                            Ver minha escala agora →
                          </button>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => alert.id && userProfile?.uid && scaleService.hideAlert(alert.id, userProfile.uid)}
                        className="absolute bottom-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Apagar aviso"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
          )}
        </div>
      );
    }

    return (
      <>
        {/* Weekly Calendar Picker */}
        <div className="px-4 py-4 bg-white border-b border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">
                {mounted ? (
                  `${currentMonth} / Semana ${selectedWeek}`
                ) : (
                  'Carregando...'
                )}
              </h2>
              <button onClick={() => setIsScaleVisible(!isScaleVisible)} className="text-slate-400 hover:text-blue-600">
                {isScaleVisible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            <div className="flex gap-1">
               <button 
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors"
                title="Semana Anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors"
                title="Próxima Semana"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar snap-x">
             {[1, 2, 3, 4, 5].map((w) => (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className={`flex-none snap-center px-5 py-2.5 rounded-2xl text-xs font-black uppercase transition-all relative border ${
                    selectedWeek === w
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 scale-105"
                      : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  S{w}
                  {w === currentWeek && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 border border-white"></span>
                    </span>
                  )}
                </button>
             ))}
             {/* Simple visual indicator of dates for the week */}
             <div className="flex-1 min-w-[12px]"></div>
             <div className="text-[10px] font-black text-slate-300 uppercase whitespace-nowrap bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
               {currentDaysOfWeek[0].date} - {currentDaysOfWeek[6].date}
             </div>
          </div>

          <div className="mt-4 flex justify-between items-center bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
            {currentDaysOfWeek.map((day) => {
              const isToday = day.fullDate === todayFullDate;
              return (
                <div key={day.name} className="flex flex-col items-center gap-1 flex-1">
                  <span className={`text-[9px] font-black uppercase ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                    {day.name}
                  </span>
                  <div className={`size-8 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                    isToday 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                      : 'text-slate-700'
                  }`}>
                    {day.date}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shift List Section */}
        <div className="flex flex-col gap-3 p-4 pb-24">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Escala da Semana</h3>
          
          {!isScaleVisible ? (
             <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm text-center">
               <EyeOff size={48} className="text-slate-300 mb-4" />
               <p className="text-slate-500 font-medium text-sm">Escala ocultada</p>
             </div>
          ) : currentShifts.every(day => !day.shift) ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <CalendarOff size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium text-sm">Escala não publicada ou sem turnos.</p>
              <div className="w-full mt-6 space-y-3 opacity-50">
                <div className="h-20 bg-slate-50 rounded-xl border border-slate-100 animate-pulse"></div>
                <div className="h-20 bg-slate-50 rounded-xl border border-slate-100 animate-pulse"></div>
              </div>
            </div>
          ) : (
            currentShifts.map((day) => {
              const { shift } = day;
              
              if (!shift) return null;

              if (shift.type === 'DSR') {
                return (
                  <div key={day.fullDate} className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="flex flex-col items-center min-w-[48px]">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">{day.name}</span>
                      <span className="text-xl font-bold text-emerald-800">{day.date}</span>
                    </div>
                    <div className="h-10 w-px bg-emerald-200"></div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                        <CalendarOff size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-emerald-700 uppercase tracking-tight">Folga (DSR)</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Descanso Semanal</p>
                      </div>
                    </div>
                  </div>
                );
              }

              if (shift.type === 'FALTA') {
                return (
                  <div key={day.fullDate} className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 border border-red-100">
                    <div className="flex flex-col items-center min-w-[48px]">
                      <span className="text-[10px] font-bold text-red-400 uppercase">{day.name}</span>
                      <span className="text-xl font-bold text-red-600">{day.date}</span>
                    </div>
                    <div className="h-10 w-px bg-red-200"></div>
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 uppercase">
                          Falta
                        </span>
                        <p className="text-sm font-bold text-red-600">Ausência</p>
                      </div>
                    </div>
                  </div>
                );
              }

              const isActive = shift.status === 'EM ANDAMENTO';

              return (
                <div 
                  key={day.fullDate} 
                  className={`flex items-center gap-4 p-4 rounded-2xl border shadow-sm relative overflow-hidden transition-all ${
                    isActive ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col items-center min-w-[48px]">
                    <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                      {day.name}
                    </span>
                    <span className={`text-xl font-bold ${isActive ? 'text-blue-700' : 'text-slate-900'}`}>
                      {day.date}
                    </span>
                  </div>
                  <div className={`h-10 w-px ${isActive ? 'bg-blue-200' : 'bg-slate-200'}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        shift.type === 'MANHÃ' ? 'bg-amber-100 text-amber-700' : 
                        shift.type === 'TARDE' ? 'bg-orange-100 text-orange-700' : 
                        shift.type === 'NOITE' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {shift.type}
                      </span>
                      {isActive ? (
                        <span className="text-[10px] font-bold text-blue-600 animate-pulse">EM ANDAMENTO</span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500">{shift.location}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <p className={`text-sm font-bold ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>
                        {shift.startTime} - {shift.endTime}
                      </p>
                    </div>
                  </div>
                  {isActive ? (
                    <CheckCircle2 size={24} className="text-blue-600" />
                  ) : (
                    <MoreVertical size={20} className="text-slate-300" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </>
    );
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-50 overflow-x-hidden sm:max-w-md sm:mx-auto sm:border-x border-slate-200 transition-colors">
      
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm p-6 bg-white shadow-xl rounded-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Phone className="text-green-500" size={24} />
              WhatsApp
            </h2>
            <p className="text-sm text-slate-600 mb-6">Para recebermos suas notificações e avisos, por favor insira seu número de WhatsApp com DDD.</p>
            <input 
              type="tel" 
              value={whatsapp} 
              onChange={handleWhatsAppChange}
              placeholder="(00) 00000-0000"
              className="w-full p-3 mb-6 bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 rounded-xl"
            />
            <button 
              onClick={saveWhatsApp}
              disabled={savingWhatsApp}
              className="w-full py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 rounded-xl"
            >
              {savingWhatsApp ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm p-6 bg-white shadow-xl rounded-2xl relative">
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Lock className="text-blue-500" size={24} />
              Redefinir Senha
            </h2>
            <p className="text-sm text-slate-600 mb-6">Como é seu primeiro acesso, por favor crie uma nova senha para sua conta.</p>
            <div className="relative mb-6">
              <input 
                type={showNewPassword ? "text" : "password"} 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha (min. 6 caracteres)"
                className="w-full p-3 bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button 
              onClick={async () => {
                if (newPassword.length < 6) return;
                try {
                  await updatePassword(auth.currentUser!, newPassword);
                  await scaleService.updateUserProfile(userProfile!.uid, { forcePasswordChange: false });
                  setShowPasswordModal(false);
                } catch (e) {
                  console.error(e);
                  alert('Erro ao atualizar senha, faça login novamente.');
                }
              }}
              className="w-full py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 rounded-xl"
            >
              Salvar Nova Senha
            </button>
          </div>
        </div>
      )}

      <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-slate-200 transition-colors">
        <div className="flex items-center p-4 justify-between sm:max-w-md sm:mx-auto w-full">
          <div className="flex size-10 shrink-0 items-center">
            <div className="size-10 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
              <User size={20} />
            </div>
          </div>
          <div className="flex-1 px-3">
            <h1 className="text-slate-900 text-lg font-bold leading-tight">
              Olá, {user?.name.split(' ')[0]}
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              {team ? team.name : 'Sem Equipe'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleLogout}
              className="flex size-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={unreadCount} />
    </div>
  );
}
