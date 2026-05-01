"use client";

import React, { Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  AlertTriangle,
  Clock,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserMinus,
  Search,
  Plus,
  Filter,
  Calendar,
  BarChart3,
  Settings,
  LayoutDashboard,
  Shield,
  Mail,
  Smartphone,
  CheckCircle2,
  Bell,
  Loader2,
  X,
  Trash2,
  Edit,
  Save,
  Check,
  UserPlus,
  ArrowLeft,
  Crown,
  Maximize,
  Image as ImageIcon,
  Share2,
  MoreVertical,
  Link as LinkIcon,
  MapPin,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { getDaysForWeek, getCurrentWeekNumber, getWeekLabel, REFERENCE_MONDAY } from "@/lib/dateUtils";
import { useSearchParams, useRouter } from "next/navigation";
import { getDb, auth, secondaryAuth } from "@/lib/firebase";
import {
  scaleService,
  Team,
  UserProfile,
  ShareRequest,
  Alert,
} from "@/lib/services/scaleService";
import { pushService } from "@/lib/services/pushService";
import {
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { toPng } from "html-to-image";

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [adminProfile, setAdminProfile] = React.useState<
    UserProfile | undefined
  >(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [notification, setNotification] = React.useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const router = useRouter();

  const showNotification = (
    message: string,
    type: "success" | "error" | "warning" = "success",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const hasUnread = React.useMemo(() => {
    if (!adminProfile) return false;
    return alerts.some((a) => !a.readBy?.includes(adminProfile.uid));
  }, [alerts, adminProfile]);

  React.useEffect(() => {
    if (adminProfile) {
      const unsub = scaleService.subscribeToAlerts(
        adminProfile.uid,
        adminProfile.teamId,
        setAlerts,
      );
      return () => unsub();
    }
  }, [adminProfile]);

  const [todayIso, setTodayIso] = React.useState("");

  React.useEffect(() => {
    setMounted(true);
    setTodayIso(new Date().toISOString().split("T")[0]);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const unsubProfile = scaleService.subscribeToUserProfile(
          user.uid,
          (profile) => {
            if (profile) {
              if (profile.isadmin !== true) {
                router.push("/");
                return;
              }
              setAdminProfile(profile);
              setLoading(false);
            } else {
              // Profile not found - might be redirected or error
            }
          },
        );
        return () => unsubProfile();
      } catch (err) {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const currentTab = mounted
    ? searchParams.get("tab") || "dashboard"
    : "dashboard";

  const renderContent = () => {
    if (!mounted || loading || !adminProfile) {
      return (
        <div className="space-y-6" suppressHydrationWarning>
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            suppressHydrationWarning
          >
            <div
              className="h-32 bg-slate-200 rounded-2xl animate-pulse"
              suppressHydrationWarning
            ></div>
            <div
              className="h-32 bg-slate-200 rounded-2xl animate-pulse"
              suppressHydrationWarning
            ></div>
            <div
              className="h-32 bg-slate-200 rounded-2xl animate-pulse"
              suppressHydrationWarning
            ></div>
          </div>
          <div
            className="h-16 bg-slate-200 rounded-xl animate-pulse"
            suppressHydrationWarning
          ></div>
          <div
            className="h-96 bg-slate-200 rounded-2xl animate-pulse"
            suppressHydrationWarning
          ></div>
        </div>
      );
    }

    switch (currentTab) {
      case "equipes":
        return (
          <EquipesContent
            showNotification={showNotification}
            adminUid={adminProfile.uid}
            isadmin={adminProfile.isadmin}
          />
        );
      case "postos":
        return (
            <PostosContent
                showNotification={showNotification}
                adminUid={adminProfile.uid}
            />
        );
      case "usuarios":
        return (
          <UsuariosContent
            showNotification={showNotification}
            adminUid={adminProfile.uid}
          />
        );
      case "cadastrar":
        return (
          <CadastrarContent
            showNotification={showNotification}
            onSuccess={() => router.push("/admin?tab=usuarios")}
          />
        );
      case "relatorios":
        return <RelatoriosContent showNotification={showNotification} />;
      case "avisos":
      case "alertas":
        return (
          <AvisosContent
            showNotification={showNotification}
            adminUid={adminProfile.uid}
          />
        );
      case "perfil":
        return (
          <PerfilContent
            user={adminProfile}
            showNotification={showNotification}
          />
        );
      case "configuracoes":
        return <ConfiguracoesContent showNotification={showNotification} />;
      default:
        return (
          <DashboardContent
            showNotification={showNotification}
            adminUid={adminProfile.uid}
            isadmin={adminProfile.isadmin}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden transition-colors">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "50%" }}
            animate={{ opacity: 1, y: 0, x: "50%" }}
            exit={{ opacity: 0, y: -20, x: "50%" }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 border transition-colors ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : notification.type === "error"
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-blue-50 text-blue-600 border-blue-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            <span className="font-bold text-sm whitespace-nowrap">
              {notification.message}
            </span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-70"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <AdminHeader
          user={adminProfile}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          hasUnread={hasUnread}
        />
        <div className="p-4 sm:p-8">{renderContent()}</div>
      </main>
    </div>
  );
}

function PostosContent({
  showNotification,
  adminUid,
}: {
  showNotification: any;
  adminUid: string;
}) {
  const [postos, setPostos] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingUsers, setLoadingUsers] = React.useState(true);

  React.useEffect(() => {
    const unsubPostos = scaleService.subscribeToPostos((fetchedPostos) => {
      const result = Array.from({ length: 20 }, (_, i) => {
        const numero = i + 1;
        const exists = fetchedPostos.find((p) => p.numero === numero);
        return exists || { numero };
      });
      setPostos(result);
      setLoading(false);
    });

    const unsubUsers = scaleService.subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
      setLoadingUsers(false);
    });

    return () => {
      unsubPostos();
      unsubUsers();
    };
  }, []);

  const handleUpdate = async (numero: number, field: string, value: any) => {
    const posto = postos.find((p) => p.numero === numero);
    const updatedPosto = { ...posto, [field]: value, numero };

    try {
      await scaleService.updatePosto(`posto_${numero}`, updatedPosto);
      showNotification(`Vaga ${numero} atualizada!`, "success");
    } catch (e) {
      showNotification("Erro ao atualizar vaga", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Mapa Operacional
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Gerencie o posicionamento da equipe nos 20 postos de trabalho.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100 flex items-center gap-2">
            <Users size={14} />
            <span>{users.length} Colaboradores</span>
          </div>
        </div>
      </div>

      {loading || loadingUsers ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-500 font-bold">Instalando mapa...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {postos
            .sort((a, b) => a.numero - b.numero)
            .map((p) => {
              const user1 = users.find((u) => u.uid === p.turno1UserId);
              const user2 = users.find((u) => u.uid === p.turno2UserId);

              return (
                <div
                  key={p.numero}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all"
                >
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
                    <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest">
                      Posto
                    </span>
                    <span className="text-sm font-black text-slate-900 group-hover:text-blue-700">
                      #{p.numero}
                    </span>
                  </div>

                  <div className="p-3 space-y-3 flex-1">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                        Turno 1
                      </label>
                      <select
                        value={p.turno1UserId || ""}
                        onChange={(e) =>
                          handleUpdate(p.numero, "turno1UserId", e.target.value)
                        }
                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] font-bold outline-none transition-all ${user1 ? "text-blue-600 border-blue-100 bg-blue-50/30" : "text-slate-900"}`}
                      >
                        <option value="">Livre</option>
                        {users.map((u) => (
                          <option key={u.uid} value={u.uid}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                        Turno 2
                      </label>
                      <select
                        value={p.turno2UserId || ""}
                        onChange={(e) =>
                          handleUpdate(p.numero, "turno2UserId", e.target.value)
                        }
                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] font-bold outline-none transition-all ${user2 ? "text-emerald-600 border-emerald-100 bg-emerald-50/30" : "text-slate-900"}`}
                      >
                        <option value="">Livre</option>
                        {users.map((u) => (
                          <option key={u.uid} value={u.uid}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="px-3 pb-3 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                        Horário de Troca
                      </label>
                      <input
                        type="time"
                        value={p.horarioTroca || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPostos((prev) =>
                            prev.map((item) =>
                              item.numero === p.numero
                                ? { ...item, horarioTroca: val }
                                : item,
                            ),
                          );
                        }}
                        onBlur={(e) =>
                          handleUpdate(p.numero, "horarioTroca", e.target.value)
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold focus:ring-0 focus:border-slate-300"
                      />
                    </div>
                    <input
                      placeholder="Obs..."
                      value={p.observacao || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPostos((prev) =>
                          prev.map((item) =>
                            item.numero === p.numero
                              ? { ...item, observacao: val }
                              : item,
                          ),
                        );
                      }}
                      onBlur={(e) =>
                        handleUpdate(p.numero, "observacao", e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-medium focus:ring-0 focus:border-slate-300 placeholder:text-slate-300"
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-900 transition-colors">
          Carregando...
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}

function DashboardContent({
  showNotification,
  adminUid,
  isadmin,
}: {
  showNotification: any;
  adminUid: string;
  isadmin?: boolean;
}) {
  const [activeGroup, setActiveGroup] = React.useState("TODOS");
  const [activeScaleType, setActiveScaleType] = React.useState<
    "FOLGA" | "ALMOCO"
  >("FOLGA");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [assigningShift, setAssigningShift] = React.useState<{
    user: UserProfile;
    day: any;
  } | null>(null);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [selectedWeek, setSelectedWeek] = React.useState(
    getCurrentWeekNumber(),
  );
  const [showPublishModal, setShowPublishModal] = React.useState(false);
  const [showPreviewModal, setShowPreviewModal] = React.useState(false);
  const [publishWeek, setPublishWeek] = React.useState(getCurrentWeekNumber());
  const [publishOption, setPublishOption] = React.useState<
    "general" | "modified"
  >("general");
  const [savedCustomShifts, setSavedCustomShifts] = React.useState<
    { name: string; start: string; end: string; color: string }[]
  >([]);
  const [todayIso, setTodayIso] = React.useState("");
  const [showFullScale, setShowFullScale] = React.useState(false);
  const [selectedCustomColor, setSelectedCustomColor] = React.useState("bg-blue-500");

  const currentWeekNum = React.useMemo(() => getCurrentWeekNumber(), []);
  const currentWeeksData = React.useMemo(() => {
    const weeks = [];
    const baseWeek = Math.floor(currentWeekNum / 5) * 5;
    for (let i = 0; i < 5; i++) {
      const w = baseWeek + i;
      weeks.push({
        weekNum: w,
        days: getDaysForWeek(w)
      });
    }
    return weeks;
  }, [currentWeekNum]);

  const allWeeksDays = React.useMemo(() => {
    return currentWeeksData.flatMap(w => w.days);
  }, [currentWeeksData]);

  const currentDaysOfWeek = React.useMemo(
    () => getDaysForWeek(selectedWeek),
    [selectedWeek],
  );


  React.useEffect(() => {
    if (!adminUid) return;
    setTodayIso(new Date().toISOString().split("T")[0]);
    setIsLoading(true);

    // 1. Subscribe to Teams
    const unsubTeams = scaleService.subscribeToTeams((fetchedTeams) => {
      setTeams(fetchedTeams);
      setIsLoading(false);
    });

    const unsubSettings = scaleService.subscribeToSettings((settings) => {
      if (settings?.customShifts) {
        setSavedCustomShifts(settings.customShifts);
      }
    });

    return () => {
      unsubTeams();
      unsubSettings();
    };
  }, [adminUid]);

  // 2. Subscribe to Users based on Teams (to handle shared access)
  React.useEffect(() => {
    if (!adminUid) return;
    const teamIds = teams.map((t) => t.id).filter(Boolean) as string[];
    const unsubUsers = scaleService.subscribeToUsers(setUsers, teamIds);
    return () => unsubUsers();
  }, [adminUid, teams]);

  const handleSaveCustomShift = async (
    name: string,
    start: string,
    end: string,
    color: string,
  ) => {
    const newShift = { name: name.toUpperCase(), start, end, color };
    const updated = [...savedCustomShifts, newShift];
    setSavedCustomShifts(updated);
    try {
      await scaleService.saveSettings({ customShifts: updated });
    } catch (e) {}
  };

  const handleRemoveCustomShift = async (index: number) => {
    const updated = savedCustomShifts.filter((_, i) => i !== index);
    setSavedCustomShifts(updated);
    try {
      await scaleService.saveSettings({ customShifts: updated });
    } catch (e) {}
  };

  const filteredCollaborators = React.useMemo(() => {
    return users
      .filter((user) => {
        // Se não for super-admin, só vê colaboradores de equipes onde é líder ou admin
        const team = teams.find(t => t.id === user.teamId);
        const hasAccessToTeam = isadmin || (team && (
          team.leaderId === adminUid || 
          team.ownerId === adminUid || 
          (team.sharedWith && team.sharedWith.includes(adminUid))
        ));

        if (!hasAccessToTeam) return false;

        const matchesGroup =
          activeGroup === "TODOS" || user.teamId === activeGroup;
        const matchesSearch = user.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        return matchesGroup && matchesSearch;
      })
      .sort((a, b) => {
        const teamA = teams.find((t) => t.id === a.teamId);
        const teamB = teams.find((t) => t.id === b.teamId);

        const rankA = teamA?.order || 0;
        const rankB = teamB?.order || 0;

        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
      });
  }, [users, activeGroup, searchTerm, teams, adminUid, isadmin]);

  const dailyCounts = React.useMemo(() => {
    return allWeeksDays.map((day) => {
      return filteredCollaborators.filter((user) => {
        const shift = user.shifts?.[day.fullDate];
        return shift && shift.type !== "DSR" && shift.type !== "FOLGA";
      }).length;
    });
  }, [allWeeksDays, filteredCollaborators]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const notifyUser = async (
    user: UserProfile,
    title: string,
    message: string,
  ) => {
    const tokens: string[] = [];
    if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
      user.fcmTokens.forEach((t: any) => {
        if (typeof t === "string") tokens.push(t);
        else if (t && typeof t === "object" && t.token) tokens.push(t.token);
      });
    }
    if (
      user.fcmToken &&
      typeof user.fcmToken === "string" &&
      !tokens.includes(user.fcmToken)
    ) {
      tokens.push(user.fcmToken);
    }

    const uniqueTokens = Array.from(new Set(tokens));
    if (uniqueTokens.length > 0) {
      try {
        await pushService.sendToMultiple(uniqueTokens, title, message);
      } catch (err) {
        // Log removed
      }
    }

    await scaleService.createAlert({
      title,
      message,
      targetAudience: "user",
      targetId: user.uid,
      createdBy: auth.currentUser?.uid || "admin",
      recipientWhatsApp: user.whatsapp || "",
      recipientTokens: uniqueTokens,
    });
  };

  const handleAssignShift = async (
    type: string | null,
    startTime: string,
    endTime: string,
    color?: string,
  ) => {
    if (!assigningShift) return;
    if (selectedWeek < currentWeekNum) {
      showNotification("Semanas anteriores não podem ser editadas", "warning");
      setAssigningShift(null);
      return;
    }
    const { user, day } = assigningShift;

    try {
      const updatedShifts = { ...(user.shifts || {}) };
      const isRemoving = type === null;

      if (isRemoving) {
        delete updatedShifts[day.fullDate];
      } else {
        updatedShifts[day.fullDate] = {
          type,
          startTime,
          endTime,
          color: color || (type === "DSR" ? "bg-green-600" : type === "FALTA" ? "bg-red-600" : "bg-blue-500"),
          published: false,
        };
      }

      await scaleService.updateUserProfile(user.uid, { shifts: updatedShifts });

      setAssigningShift(null);
      showNotification("Turno atribuído com sucesso!", "success");
    } catch (error) {
      showNotification("Erro ao atribuir turno", "error");
    }
  };

  const [showToolsModal, setShowToolsModal] = React.useState(false);
  const [showClearModal, setShowClearModal] = React.useState(false);
  const [clearTarget, setClearTarget] = React.useState<"ALL" | string>("ALL");

  const handleClearWeekScale = async (userId?: string) => {
    if (selectedWeek < currentWeekNum) {
      showNotification("Semanas anteriores não podem ser editadas", "warning");
      setShowClearModal(false);
      return;
    }
    setIsPublishing(true);
    try {
      const targetDays = getDaysForWeek(selectedWeek);
      const targetUsers = userId
        ? users.filter((u) => u.uid === userId)
        : users;

      for (const user of targetUsers) {
        const updatedShifts = { ...(user.shifts || {}) };
        let changed = false;
        targetDays.forEach((day) => {
          if (updatedShifts[day.fullDate]) {
            delete updatedShifts[day.fullDate];
            changed = true;
          }
        });

        if (changed) {
          await scaleService.updateUserProfile(user.uid, {
            shifts: updatedShifts,
          });
        }
      }
      showNotification("Escala da semana limpa com sucesso!", "success");
      setShowClearModal(false);
    } catch (error) {
      showNotification("Erro ao limpar escala", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishScale = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (publishWeek < currentWeekNum) {
      showNotification("Semanas anteriores não podem ser editadas", "warning");
      setShowPublishModal(false);
      return;
    }
    setIsPublishing(true);
    try {
      const targetDays = getDaysForWeek(publishWeek);
      let anyScalePublished = false;
      let individualsNotified = 0;

      // Update shifts efficiently
      const updatePromises = users.map(async (user) => {
        if (!user.teamId) return;
        const team = teams.find((t) => t.id === user.teamId);
        if (!team || !team.schedule) return;

        const oldShifts = user.shifts || {};
        const newShifts = { ...oldShifts };
        let hasChanges = false;

        targetDays.forEach((day) => {
          if (!newShifts[day.fullDate]) {
            const dayKey = day.name
              .toLowerCase()
              .substring(0, 3)
              .replace("á", "a") as keyof typeof team.schedule;
            const scheduleStr = team.schedule[dayKey];

            if (!scheduleStr || scheduleStr === "FOLGA") {
              newShifts[day.fullDate] = {
                type: "DSR",
                startTime: "-",
                endTime: "-",
                published: true,
              };
            } else {
              const [start, end] = scheduleStr.split("-");
              const type = idxToShiftType(dayKey);
              newShifts[day.fullDate] = {
                type,
                startTime: start || "08:00",
                endTime: end || "17:00",
                published: true,
              };
            }
            hasChanges = true;
          } else if (newShifts[day.fullDate].published === false) {
            // Manual edit detection
            newShifts[day.fullDate].published = true;
            hasChanges = true;
          }
        });

        // CRITICAL: Only notify if there's a modification
        if (hasChanges) {
          await scaleService.updateUserProfile(user.uid, { shifts: newShifts });
          anyScalePublished = true;
          individualsNotified++;

          // Token extraction with DeviceToken support
          const extractTokens = (u: UserProfile) => {
            const list: string[] = [];
            if (u.fcmTokens) {
              u.fcmTokens.forEach((t: any) => {
                if (typeof t === "string") list.push(t);
                else if (t?.token) list.push(t.token);
              });
            }
            if (u.fcmToken && !list.includes(u.fcmToken)) list.push(u.fcmToken);
            return list;
          };

          const userTokens = Array.from(new Set(extractTokens(user)));

          // Find all off days (DSR) in the published week
          const offDaysDB: string[] = [];
          const offDaysPush: string[] = [];
          targetDays.forEach((day) => {
            const shift = newShifts[day.fullDate];
            if (shift && shift.type === "DSR") {
              const [y, m, d] = day.fullDate.split("-");
              offDaysDB.push(`${day.name} (${d}/${m}/${y})`);
              offDaysPush.push(`${day.name} (${day.date})`);
            }
          });

          let offDaysMessageDB = "";
          let offDaysMessagePush = "";
          if (offDaysDB.length === 1) {
            offDaysMessageDB = ` Sua próxima folga é: ${offDaysDB[0]}.`;
            offDaysMessagePush = ` Sua próxima folga é: ${offDaysPush[0]}.`;
          } else if (offDaysDB.length > 1) {
            offDaysMessageDB = ` Suas próximas folgas são: ${offDaysDB.join(", ")}.`;
            offDaysMessagePush = ` Suas próximas folgas são: ${offDaysPush.join(", ")}.`;
          }

          const lunchMessage = user.defaultLunchTime ? ` Seu horário de almoço é: ${user.defaultLunchTime}.` : "";
          const dbMessage = `A sua escala para a semana ${getWeekLabel(publishWeek)} foi atualizada.${lunchMessage}${offDaysMessageDB}`;
          const pushMessage = `A sua escala para a semana ${getWeekLabel(publishWeek)} foi atualizada.${lunchMessage}${offDaysMessagePush}`;

          await scaleService.createAlert({
            title: "Escala Atualizada 📅",
            message: dbMessage,
            targetAudience: "user",
            targetId: user.uid,
            priority: "Normal",
            createdBy: auth.currentUser?.uid || "admin",
            recipientWhatsApp: user.whatsapp || "",
            recipientTokens: userTokens,
          });

          if (userTokens.length > 0) {
            pushService
              .sendToMultiple(userTokens, "Escala Atualizada 📅", pushMessage)
              .catch(() => {});
          }
        }
      });

      await Promise.all(updatePromises);

      if (anyScalePublished) {
        // Create a general alert ONLY if it's a general publication
        if (publishOption === "general") {
          await scaleService.createAlert({
            title: "Nova Escala Publicada 📅",
            message: `Atenção equipe! A escala para a semana ${getWeekLabel(publishWeek)} foi publicada e já está disponível para consulta no aplicativo.`,
            targetAudience: "all",
            targetId: "",
            priority: "Normal",
            createdBy: auth.currentUser?.uid || "admin",
            recipientWhatsApp: "GROUP",
            recipientTokens: [],
          });
        }

        showNotification(
          publishOption === "general"
            ? `Escala publicada e ${individualsNotified} pessoas notificadas na semana ${getWeekLabel(publishWeek)}.`
            : `Alterações salvas e ${individualsNotified} pessoas notificadas individualmente.`,
          "success",
        );
      } else {
        showNotification(
          "Nenhuma nova escala pendente para publicação.",
          "warning",
        );
      }

      setShowPublishModal(false);
    } catch (error) {
      showNotification("Erro ao publicar escala", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const idxToShiftType = (dayKey: string) => {
    // Map dayKey to a shift type based on some logic or just return a default
    // For now, let's return MANHÃ as default but make it clear it's a mapping
    const mapping: Record<string, string> = {
      seg: "MANHÃ",
      ter: "MANHÃ",
      qua: "MANHÃ",
      qui: "MANHÃ",
      sex: "MANHÃ",
      sab: "MANHÃ",
      dom: "DSR",
    };
    return mapping[dayKey] || "MANHÃ";
  };

  const handleExport = () => {
    // Calculate 8 days starting from Sunday of the selected week
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const diff =
      firstDayOfMonth.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const firstMonday = new Date(year, month, diff);

      const targetMonday = new Date(REFERENCE_MONDAY);
      targetMonday.setDate(REFERENCE_MONDAY.getDate() + (selectedWeek) * 7);

      const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() - 1); // Sunday before Monday

    const exportDays: { name: string; date: string; fullDate: string }[] = [];
    const dayNames = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
    for (let i = 0; i < 8; i++) {
      const d = new Date(targetSunday);
      d.setDate(targetSunday.getDate() + i);
      exportDays.push({
        name: dayNames[i],
        date: `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`,
        fullDate: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`,
      });
    }

    const headers1 = [
      "COLABORADORES",
      "ESCALA",
      "EMPRESA",
      "CONTRATO",
      "ADMISSÃO",
      ...exportDays.map((d) => d.name),
    ];
    const headers2 = ["", "", "", "", "", ...exportDays.map((d) => d.date)];

    const rows = filteredCollaborators.map((user) => {
      const team = teams.find((t) => t.id === user.teamId);
      const teamName = team?.name || "N/A";

      // Derive Escala from team schedule
      let escala = "N/A";
      if (team) {
        const s = team.schedule;
        if (
          s.seg &&
          s.ter &&
          s.qua &&
          s.qui &&
          s.sex &&
          s.sab &&
          s.dom === "DSR"
        ) {
          escala = "SEG - SAB";
        } else if (
          s.seg &&
          s.ter &&
          s.qua &&
          s.qui &&
          s.sex &&
          s.sab &&
          s.dom
        ) {
          escala = "6X1";
        } else {
          escala = teamName;
        }
      }

      const admissionDate = user.admissionDate
        ? user.admissionDate.split("-").reverse().join("/")
        : "---";
      const company = user.company || "MELI";
      const contract = user.contract || "MELI";

      const shifts = exportDays.map((day) => {
        const s = user.shifts?.[day.fullDate];
        return s ? s.type : "---";
      });

      return [
        user.name.toUpperCase(),
        escala,
        company,
        contract,
        admissionDate,
        ...shifts,
      ];
    });

    const csvContent = [headers1, headers2, ...rows]
      .map((e) => e.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "escala_ecooy.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateImage = async () => {
    const node = document.getElementById("mobile-print-container");
    if (!node) return;

    try {
      // Temporarily make it visible for html2canvas to work properly
      const originalPosition = node.style.position;
      const originalLeft = node.style.left;
      node.style.position = "relative";
      node.style.left = "0";

      const dataUrl = await toPng(node, {
        backgroundColor: "#f8fafc", // slate-50
        pixelRatio: 2, // High quality for mobile
      });

      // Revert styles
      node.style.position = originalPosition;
      node.style.left = originalLeft;

      const link = document.createElement("a");
      link.download = `escala_semana_${getWeekLabel(selectedWeek)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      showNotification("Erro ao gerar imagem da escala.", "error");

      // Revert styles on error
      node.style.position = "absolute";
      node.style.left = "-9999px";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-slate-200 rounded-2xl animate-pulse"></div>
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveScaleType("FOLGA")}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeScaleType === "FOLGA"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Escala de Turnos
          </button>
          <button
            onClick={() => setActiveScaleType("ALMOCO")}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeScaleType === "ALMOCO"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Horários de Almoço
          </button>
        </div>
      </div>

      {/* Conditional Rendering logic for Shift Scale vs Lunch Groups */}
      {activeScaleType === "FOLGA" ? (
        <div className="space-y-6">
          {/* Filters & Controls */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 w-full">
            <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-start md:items-center">
              <div className="flex gap-2 items-center overflow-x-auto pb-2 md:pb-0 flex-1 w-full md:w-auto">
                <button
                  onClick={() => setActiveGroup("TODOS")}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${
                    activeGroup === "TODOS"
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-600"
                  }`}
                >
                  Todos
                </button>
                {teams
                  .filter(team => 
                    isadmin || 
                    team.leaderId === adminUid || 
                    (team.sharedWith && team.sharedWith.includes(adminUid)) ||
                    team.ownerId === adminUid
                  )
                  .map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setActiveGroup(team.id!)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${
                      activeGroup === team.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-600"
                    }`}
                  >
                    {team.name}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64 flex-none">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar colaborador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Schedule Grid */}
          <div
            id="schedule-grid"
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-colors flex flex-col"
          >
            {/* Scale Controls Header */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 p-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex flex-col gap-2 w-full xl:w-auto">
                <div className="flex items-center justify-between md:justify-start gap-4">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Visualizar Escala</h3>
                   <div className="flex gap-1 md:hidden">
                    <button 
                      onClick={() => setSelectedWeek(prev => prev - 1)}
                      className="p-1 rounded bg-white border border-slate-200 text-slate-400"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button 
                      onClick={() => setSelectedWeek(prev => prev + 1)}
                      className="p-1 rounded bg-white border border-slate-200 text-slate-400"
                    >
                      <ChevronRight size={14} />
                    </button>
                   </div>
                </div>
                <div className="flex bg-slate-100/80 p-1.5 rounded-2xl overflow-x-auto border border-slate-200/60 shadow-inner max-w-full relative hide-scrollbar">
                  {(() => {
                    const startWeek = Math.floor(selectedWeek / 5) * 5;
                    return [0, 1, 2, 3, 4].map((i) => {
                      const weekIdx = startWeek + i;
                      return (
                        <button
                          key={weekIdx}
                          onClick={() => setSelectedWeek(weekIdx)}
                          className={`flex-none px-6 py-2 rounded-xl text-xs font-black uppercase transition-all relative ${
                            selectedWeek === weekIdx
                              ? "bg-white text-blue-600 shadow-md z-10 scale-105"
                              : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 z-0"
                          }`}
                        >
                          Semana {getWeekLabel(weekIdx)}
                          {weekIdx === currentWeekNum && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-white"></span>
                            </span>
                          )}
                          {selectedWeek === weekIdx && (
                            <motion.div 
                              layoutId="active-week-bg"
                              className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                            />
                          )}
                        </button>
                      );
                    });
                  })()}
                  {/* Reset/Next Loop Button */}
                  <button
                    onClick={() => setSelectedWeek(selectedWeek + 1)}
                    className="flex-none px-4 py-2 rounded-xl text-xs font-black text-blue-400 hover:text-blue-600 transition-all flex items-center gap-1"
                    title="Próxima Semana"
                  >
                    PRÓX
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowFullScale(true)}
                  className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2 border border-slate-200 shadow-sm"
                >
                  <Maximize size={18} />
                  <span>Escala Completa</span>
                </button>
                <button
                  onClick={() => setShowToolsModal(true)}
                  className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2 border border-slate-200 shadow-sm"
                >
                  <Settings size={18} />
                  <span>Ferramentas</span>
                </button>
                <button
                  onClick={() => {
                    setPublishWeek(selectedWeek);
                    setPublishOption("general");
                    setShowPublishModal(true);
                  }}
                  className="flex-[2] sm:flex-none justify-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  <span>Publicar Escala</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-left w-64 min-w-[200px] border-r border-slate-200">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Colaborador
                      </span>
                    </th>
                    {currentDaysOfWeek.map((day, idx) => {
                      const isToday = day.fullDate === todayIso;
                      const workingCount = filteredCollaborators.filter(
                        (collab) => {
                          const shift = collab.shifts?.[day.fullDate];
                          if (!shift) return false;
                          const nonWorkingTypes = [
                            "DSR",
                            "FOLGA",
                            "FERIADO",
                            "LICENÇA",
                            "AFASTADO",
                          ];
                          return (
                            shift.type &&
                            !nonWorkingTypes.includes(shift.type.toUpperCase())
                          );
                        }
                      ).length;
                      
                      return (
                        <th
                          key={day.name}
                          className={`p-4 text-center min-w-[140px] ${isToday ? "bg-blue-50/50" : ""}`}
                        >
                          <div
                            className={`text-[10px] font-bold uppercase ${isToday ? "text-blue-600" : "text-slate-400"}`}
                          >
                            {day.name}
                          </div>
                          <div
                            className={`text-lg font-bold ${isToday ? "text-blue-600" : "text-slate-900"}`}
                          >
                            {day.date}
                          </div>
                          <div
                            className={`text-[9px] ${isToday ? "text-blue-500" : "text-slate-500"}`}
                          >
                            {day.fullDate.split('-')[2]}/{day.fullDate.split('-')[1]}/{day.fullDate.split('-')[0]}
                          </div>
                          <div className={`mt-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black ${workingCount > 0 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                            {workingCount} ativos
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredCollaborators.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-12 text-center text-slate-400 italic"
                      >
                        Nenhum colaborador encontrado para este grupo.
                      </td>
                    </tr>
                  ) : (
                    filteredCollaborators.map((collab) => (
                      <motion.tr
                        key={collab.uid}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                      >
                        <td className="p-4 border-r border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center font-bold text-xs text-blue-600 border border-blue-100">
                              {getInitials(collab.name)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {collab.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {teams.find((t) => t.id === collab.teamId)
                                  ?.name || "Sem Equipe"}
                              </p>
                            </div>
                          </div>
                        </td>
                        {currentDaysOfWeek.map((day, idx) => {
                          const shift = collab.shifts?.[day.fullDate];
                          const isToday = day.fullDate === todayIso;
                          const isPreviousWeek = selectedWeek < currentWeekNum;

                          return (
                            <td
                              key={day.fullDate}
                              className={`p-2 relative ${isToday ? "bg-blue-50/30" : ""}`}
                            >
                              {activeScaleType === "FOLGA" ? (
                                shift ? (
                                  <button
                                    onClick={() => {
                                      if (isPreviousWeek) {
                                        showNotification(
                                          "Semanas anteriores não podem ser editadas",
                                          "warning",
                                        );
                                        return;
                                      }
                                      setAssigningShift({ user: collab, day });
                                    }}
                                    className={`${getShiftColor(shift.type, shift.color)} text-white text-[10px] font-bold p-2.5 rounded-xl text-center shadow-sm w-full transition-transform hover:scale-105`}
                                  >
                                    {shift.type}
                                    <br />
                                    {shift.startTime} - {shift.endTime}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (isPreviousWeek) {
                                        showNotification(
                                          "Semanas anteriores não podem ser editadas",
                                          "warning",
                                        );
                                        return;
                                      }
                                      setAssigningShift({ user: collab, day });
                                    }}
                                    className="w-full bg-slate-50/50 border border-dashed border-slate-200 text-slate-300 text-[9px] font-bold py-3 rounded-xl text-center hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-1 group/btn"
                                  >
                                    <div className="size-4 rounded-full border border-slate-200 flex items-center justify-center group-hover/btn:border-blue-200">
                                      <Plus size={10} />
                                    </div>
                                    <span>LIVRE</span>
                                  </button>
                                )
                              ) : collab.defaultLunchTime ? (
                                <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold p-2.5 rounded-xl text-center shadow-sm w-full">
                                  HORÁRIO DE ALMOÇO
                                  <br />
                                  {collab.defaultLunchTime}
                                </div>
                              ) : (
                                <div className="w-full bg-slate-50/50 border border-dashed border-slate-200 text-slate-300 text-[10px] font-bold py-3 rounded-xl text-center flex flex-col items-center justify-center gap-1">
                                  SEM REF
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Print Container (Hidden) */}
          <div
            id="mobile-print-container"
            className="absolute -left-[9999px] top-0 w-[800px] bg-white p-6 flex flex-col gap-4"
          >
            <div className="text-center mb-2">
              <h1 className="text-2xl font-black text-slate-900 mb-1">
                Escala de Trabalho
              </h1>
              <p className="text-lg text-slate-500 font-bold">
                Semana {selectedWeek} ({currentDaysOfWeek[0].date} a{" "}
                {currentDaysOfWeek[6].date} de agosto de 2026)
              </p>
            </div>

            {teams.map((team) => {
              const teamCollabs = filteredCollaborators.filter(
                (c) => c.teamId === team.id,
              );
              if (teamCollabs.length === 0) return null;

              return (
                <div
                  key={team.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4"
                >
                  <div className="bg-blue-600 text-white py-2 px-4 text-center">
                    <h2 className="text-lg font-bold uppercase tracking-wider">
                      {team.name}
                    </h2>
                  </div>
                  <div className="p-0">
                    {teamCollabs.map((collab, idx) => (
                      <div
                        key={collab.uid}
                        className={`py-2 px-4 flex items-center gap-4 ${idx !== teamCollabs.length - 1 ? "border-b border-slate-100" : ""}`}
                      >
                        <h3 className="text-sm font-bold text-slate-900 w-32 truncate">
                          {collab.name}
                        </h3>
                        <div className="grid grid-cols-7 gap-1 flex-1">
                          {currentDaysOfWeek.map((day) => {
                            const shift = collab.shifts?.[day.fullDate];
                            const isDSR = shift?.type === "DSR";
                            const isFalta = shift?.type === "FALTA";
                            const isWork = shift && !isDSR && !isFalta;

                            const bgColor = isDSR
                              ? "bg-green-600 text-white"
                              : isFalta
                                ? "bg-red-50"
                                : isWork
                                  ? "bg-blue-50/50"
                                  : "bg-slate-50";
                            const borderColor = isDSR
                              ? "border-green-700"
                              : isFalta
                                ? "border-red-100"
                                : isWork
                                  ? "border-blue-100/50"
                                  : "border-slate-100";
                            const textColor = isDSR
                              ? "text-white"
                              : isFalta
                                ? "text-red-600"
                                : isWork
                                  ? "text-blue-600"
                                  : "text-slate-400";
                            const textBoldColor = isDSR
                              ? "text-white"
                              : isFalta
                                ? "text-red-700"
                                : isWork
                                  ? "text-blue-700"
                                  : "text-slate-500";

                            return (
                              <div
                                key={day.fullDate}
                                className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg ${bgColor} border ${borderColor}`}
                              >
                                <span
                                  className={`text-[9px] font-bold uppercase mb-0.5 ${textColor}`}
                                >
                                  {day.name} {day.date}
                                </span>
                                {shift ? (
                                  <>
                                    <span
                                      className={`text-[10px] font-black leading-tight ${textBoldColor}`}
                                    >
                                      {shift.type === "DSR"
                                        ? "FOLGA"
                                        : shift.type}
                                    </span>
                                    {isWork && (
                                      <span className="text-[9px] font-bold text-blue-600/80 leading-tight">
                                        {shift.startTime}-{shift.endTime}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-300">
                                    -
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {/* Demanda do dia */}
                    <div className="py-2 px-4 flex items-center gap-4 border-t border-slate-200 bg-slate-50">
                      <h3 className="text-sm font-bold text-slate-900 w-32">
                        Demanda
                      </h3>
                      <div className="grid grid-cols-7 gap-1 flex-1">
                        {currentDaysOfWeek.map((day) => {
                          const demand = filteredCollaborators.reduce(
                            (count, collab) => {
                              const shift = collab.shifts?.[day.fullDate];
                              return shift &&
                                shift.type !== "DSR" &&
                                shift.type !== "FALTA"
                                ? count + 1
                                : count;
                            },
                            0,
                          );
                          return (
                            <div
                              key={day.fullDate}
                              className="flex flex-col items-center justify-center py-1"
                            >
                              <span className="text-[10px] font-black text-slate-900">
                                {demand}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <LunchManager
          users={users}
          teams={teams}
          notifyUser={notifyUser}
          selectedWeek={selectedWeek}
          currentWeekNum={currentWeekNum}
          showNotification={showNotification}
        />
      )}

      {/* Modal Ferramentas */}
      <Modal
        isOpen={showToolsModal}
        onClose={() => setShowToolsModal(false)}
        title="Ferramentas"
      >
        <div className="space-y-3">
          <button
            onClick={() => {
              setShowToolsModal(false);
              setShowPreviewModal(true);
            }}
            className="w-full px-4 py-3 text-left bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-3"
          >
            <ImageIcon size={18} />
            Visualizar Imagem
          </button>
          <button
            onClick={() => {
              setShowToolsModal(false);
              handleExport();
            }}
            className="w-full px-4 py-3 text-left bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-3"
          >
            <Download size={18} />
            Baixar CSV
          </button>
          <button
            onClick={() => {
              setShowToolsModal(false);
              handleGenerateImage();
            }}
            className="w-full px-4 py-3 text-left bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-3"
          >
            <ImageIcon size={18} />
            Baixar Imagem
          </button>
          <button
            onClick={() => {
              setShowToolsModal(false);
              setShowClearModal(true);
            }}
            className="w-full px-4 py-3 text-left bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center gap-3"
          >
            <Trash2 size={18} />
            Limpar Escala
          </button>
        </div>
      </Modal>

      {/* Modal Limpar Escala */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Limpar Escala"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-600">
            Selecione o colaborador para limpar a escala ou limpe toda a escala
            da semana.
          </p>

          <select
            className="w-full p-2 border border-slate-300 rounded-lg"
            value={clearTarget}
            onChange={(e) => setClearTarget(e.target.value)}
          >
            <option value="ALL">Toda a escala</option>
            {users.map((user) => (
              <option key={user.uid} value={user.uid}>
                {user.name}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowClearModal(false)}
              className="px-4 py-2 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              onClick={() =>
                handleClearWeekScale(
                  clearTarget === "ALL" ? undefined : clearTarget,
                )
              }
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700"
            >
              Limpar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Publicar Escala */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Confirmar Envio"
      >
        <div className="space-y-6">
          <p className="text-lg font-bold text-slate-900 text-center pt-2">
            Publicar a{" "}
            <span className="text-blue-600">Semana {publishWeek}</span>?
          </p>

          <div className="space-y-3 px-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tipo de publicação:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setPublishOption("general")}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  publishOption === "general"
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${publishOption === "general" ? "border-blue-600" : "border-slate-300"}`}
                >
                  {publishOption === "general" && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    🔔 Publicação Geral
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Avisa todos e envia mensagem no grupo.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPublishOption("modified")}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  publishOption === "modified"
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${publishOption === "modified" ? "border-blue-600" : "border-slate-300"}`}
                >
                  {publishOption === "modified" && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    👤 Apenas Modificados
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Aviso individual (sem mensagem no grupo).
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-center gap-4">
            <button
              type="button"
              onClick={() => setShowPublishModal(false)}
              className="flex-1 px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
            >
              Cancelar
            </button>
            <button
              disabled={isPublishing}
              onClick={handlePublishScale}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPublishing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              Confirmar Envio
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Visualizar Escala */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Visualizar Escala"
      >
        <div className="w-full overflow-x-auto">
          <div className="w-[800px] bg-white p-6 flex flex-col gap-4">
            <div className="text-center mb-2">
              <h1 className="text-2xl font-black text-slate-900 mb-1">
                Escala de Trabalho
              </h1>
              <p className="text-lg text-slate-500 font-bold">
                Semana {selectedWeek} ({currentDaysOfWeek[0].date} a{" "}
                {currentDaysOfWeek[6].date} de agosto de 2026)
              </p>
            </div>

            {teams.map((team) => {
              const teamCollabs = filteredCollaborators.filter(
                (c) => c.teamId === team.id,
              );
              if (teamCollabs.length === 0) return null;

              return (
                <div
                  key={team.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4"
                >
                  <div className="bg-blue-600 text-white py-2 px-4 text-center">
                    <h2 className="text-lg font-bold uppercase tracking-wider">
                      {team.name}
                    </h2>
                  </div>
                  <div className="p-0">
                    {teamCollabs.map((collab, idx) => (
                      <div
                        key={collab.uid}
                        className={`py-2 px-4 flex items-center gap-4 ${idx !== teamCollabs.length - 1 ? "border-b border-slate-100" : ""}`}
                      >
                        <h3 className="text-sm font-bold text-slate-900 w-32 truncate">
                          {collab.name}
                        </h3>
                        <div className="grid grid-cols-7 gap-1 flex-1">
                          {currentDaysOfWeek.map((day) => {
                            const shift = collab.shifts?.[day.fullDate];
                            const isDSR = shift?.type === "DSR";
                            const isFalta = shift?.type === "FALTA";
                            const isWork = shift && !isDSR && !isFalta;

                            const bgColor = isDSR
                              ? "bg-green-600 text-white"
                              : isFalta
                                ? "bg-red-50"
                                : isWork
                                  ? "bg-blue-50/50"
                                  : "bg-slate-50";
                            const borderColor = isDSR
                              ? "border-green-700"
                              : isFalta
                                ? "border-red-100"
                                : isWork
                                  ? "border-blue-100/50"
                                  : "border-slate-100";
                            const textColor = isDSR
                              ? "text-white"
                              : isFalta
                                ? "text-red-600"
                                : isWork
                                  ? "text-blue-600"
                                  : "text-slate-400";
                            const textBoldColor = isDSR
                              ? "text-white"
                              : isFalta
                                ? "text-red-700"
                                : isWork
                                  ? "text-blue-700"
                                  : "text-slate-500";

                            return (
                              <div
                                key={day.fullDate}
                                className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg ${bgColor} border ${borderColor}`}
                              >
                                <span
                                  className={`text-[9px] font-bold uppercase mb-0.5 ${textColor}`}
                                >
                                  {day.name} {day.date}
                                </span>
                                {shift ? (
                                  <>
                                    <span
                                      className={`text-[10px] font-black leading-tight ${textBoldColor}`}
                                    >
                                      {shift.type === "DSR"
                                        ? "FOLGA"
                                        : shift.type}
                                    </span>
                                    {isWork && (
                                      <span className="text-[9px] font-bold text-blue-600/80 leading-tight">
                                        {shift.startTime}-{shift.endTime}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-300">
                                    -
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {/* Demanda do dia */}
                    <div className="py-2 px-4 flex items-center gap-4 border-t border-slate-200 bg-slate-50">
                      <h3 className="text-sm font-bold text-slate-900 w-32">
                        Demanda
                      </h3>
                      <div className="grid grid-cols-7 gap-1 flex-1">
                        {currentDaysOfWeek.map((day) => {
                          const demand = filteredCollaborators.reduce(
                            (count, collab) => {
                              const shift = collab.shifts?.[day.fullDate];
                              return shift &&
                                shift.type !== "DSR" &&
                                shift.type !== "FALTA"
                                ? count + 1
                                : count;
                            },
                            0,
                          );
                          return (
                            <div
                              key={day.fullDate}
                              className="flex flex-col items-center justify-center py-1"
                            >
                              <span className="text-[10px] font-black text-slate-900">
                                {demand}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowPreviewModal(false)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
          >
            Fechar
          </button>
        </div>
      </Modal>

      {/* Modal Atribuir Turno */}
      <Modal
        isOpen={!!assigningShift}
        onClose={() => setAssigningShift(null)}
        title={`Atribuir Turno: ${assigningShift?.user.name}`}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Data da Escala</p>
              <p className="text-sm font-bold text-slate-900 uppercase">
                {assigningShift?.day.name}, {assigningShift?.day.date}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock size={16} />
              Turnos Padrão
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ShiftOption
                label="Folga (DSR)"
                time="Dia Livre"
                color="bg-green-600 text-white"
                onClick={() => handleAssignShift("DSR", "-", "-", "bg-green-600")}
              />
              <ShiftOption
                label="Falta"
                time="Ausência"
                color="bg-red-500"
                onClick={() => handleAssignShift("FALTA", "-", "-", "bg-red-600")}
              />
              <ShiftOption
                label="Limpar Turno"
                time="Remover registro"
                color="bg-slate-500"
                onClick={() => handleAssignShift(null, "-", "-")}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-4">
              Horários Salvos
            </h4>
            {savedCustomShifts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {savedCustomShifts.map((shift, idx) => (
                  <div key={idx} className="relative group">
                    <ShiftOption
                      label={shift.name}
                      time={`${shift.start} - ${shift.end}`}
                      color={shift.color}
                      onClick={() =>
                        handleAssignShift(
                          shift.name,
                          shift.start,
                          shift.end,
                          shift.color,
                        )
                      }
                    />
                    <button
                      onClick={() => handleRemoveCustomShift(idx)}
                      className="absolute -top-1 -right-1 bg-white text-red-600 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-red-100 z-10 hover:bg-red-50"
                      title="Remover Turno Salvo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic mb-6">
                Nenhum horário personalizado salvo.
              </p>
            )}

            <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50">
              <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Plus size={16} />
                Criar Novo Horário
              </h4>
              
              {/* Color Selector */}
              <div className="mb-5">
                <label className="text-[10px] font-black text-blue-600/60 uppercase tracking-wider">Cor do Turno</label>
                <div className="flex gap-3 mt-2">
                  {["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500"].map(c => (
                    <button key={c} type="button" className={`w-9 h-9 rounded-full ${c} ${selectedCustomColor === c ? 'ring-4 ring-blue-100 ring-offset-2' : 'hover:scale-110'} transition-all`} onClick={() => setSelectedCustomColor(c)} />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-blue-600/60 uppercase tracking-wider">
                    Nome do Turno
                  </label>
                  <input
                    type="text"
                    id="custom-name"
                    className="w-full bg-white border border-blue-100 rounded-xl p-3 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                    placeholder="Ex: Madrugada, Extra, Backup..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-blue-600/60 uppercase tracking-wider">
                      Início
                    </label>
                    <input
                      type="time"
                      id="custom-start"
                      className="w-full bg-white border border-blue-100 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-blue-600/60 uppercase tracking-wider">
                      Fim
                    </label>
                    <input
                      type="time"
                      id="custom-end"
                      className="w-full bg-white border border-blue-100 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    const name =
                      (document.getElementById("custom-name") as HTMLInputElement)
                        .value || "PERSONALIZADO";
                    const start = (
                      document.getElementById("custom-start") as HTMLInputElement
                    ).value;
                    const end = (
                      document.getElementById("custom-end") as HTMLInputElement
                    ).value;
                    handleSaveCustomShift(name, start, end, selectedCustomColor);
                  }}
                  className="flex-1 py-3 bg-white text-blue-600 border border-blue-100 rounded-xl font-bold hover:bg-blue-50 transition-all"
                >
                  Salvar
                </button>
                <button
                  onClick={() => {
                    const name =
                      (document.getElementById("custom-name") as HTMLInputElement)
                        .value || "PERSONALIZADO";
                    const start = (
                      document.getElementById("custom-start") as HTMLInputElement
                    ).value;
                    const end = (
                      document.getElementById("custom-end") as HTMLInputElement
                    ).value;
                    handleAssignShift(name.toUpperCase(), start, end, selectedCustomColor);
                  }}
                  className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                >
                  Atribuir Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Full Scale Modal */}
      {showFullScale && (
        <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Maximize size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Mapa Mensal - Escala Completa</h2>
                <p className="text-xs text-slate-500 font-medium">Ciclo de 5 Semanas • {filteredCollaborators.length} Colaboradores</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Tempo Real</span>
              </div>
              <button 
                onClick={() => setShowFullScale(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-slate-100 relative scroll-smooth">
            <div className="p-2 sm:p-4 lg:p-10 min-w-full">
              <div className="bg-white border border-slate-300 shadow-xl min-w-full rounded-sm">
                <table className="border-collapse table-auto w-max text-sm relative">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300 sticky top-0 z-50">
                      <th className="sticky left-0 top-0 z-[60] bg-black p-3 sm:p-4 text-left w-32 sm:w-56 border-r-4 border-black shadow-[4px_0_15px_rgba(0,0,0,0.1)] text-[10px] font-black text-white uppercase tracking-widest">
                        Colaborador / Equipe
                      </th>
                      {allWeeksDays.map((day, idx) => {
                        const isToday = day.fullDate === todayIso;
                        const isMonday = day.name === 'Seg';
                        const weekNum = Math.floor(idx / 7) + 1;
                        
                        return (
                          <th 
                            key={`${day.fullDate}-${idx}`} 
                            className={`px-2 pt-8 pb-4 text-center border-r border-slate-300 min-w-[90px] relative sticky top-0 z-40 bg-slate-100 ${isToday ? "bg-blue-100" : ""} ${isMonday ? "border-l-2 border-l-slate-400" : ""}`}
                          >
                            {isMonday && (
                              <div className="absolute top-1 left-0 right-0 flex justify-center">
                                <span className="bg-slate-800 px-3 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider whitespace-nowrap z-10 shadow-sm">
                                  Semana {weekNum}
                                </span>
                              </div>
                            )}
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{day.name}</div>
                            <div className={`text-xl font-black mt-1 ${isToday ? "text-blue-700" : "text-slate-800"}`}>{day.date}</div>
                          </th>
                        );
                      })}
                    </tr>
                    <tr className="bg-slate-50 border-b border-slate-200 sticky top-[72px] z-50">
                      <th className="sticky left-0 z-[60] bg-black p-2 text-right text-[9px] font-bold text-white uppercase tracking-widest border-r-4 border-black shadow-[4px_0_15px_rgba(0,0,0,0.1)]">
                        Total Pessoas
                      </th>
                      {dailyCounts.map((count, idx) => (
                        <th key={idx} className="p-2 text-center text-xs font-bold text-blue-700 bg-white border-r border-slate-200 sticky top-[72px] z-40">
                          {count}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCollaborators.map((user, idx) => {
                      const team = teams.find(t => t.id === user.teamId);
                      return (
                        <tr key={user.uid} className="border-b border-slate-300 hover:bg-slate-50 transition-colors group">
                          <td className="sticky left-0 z-30 bg-black group-hover:bg-slate-900 p-2 sm:p-3 border-r-4 border-black shadow-[4px_0_15px_rgba(0,0,0,0.1)] transition-colors">
                            <div className="flex flex-col min-w-[120px] sm:min-w-[180px]">
                              <div className="font-bold text-white text-[10px] sm:text-xs uppercase tracking-tight truncate">{user.name}</div>
                              <div className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest truncate mt-0.5">{team?.name || "SEM EQUIPE"}</div>
                            </div>
                          </td>
                          {allWeeksDays.map((day, dIdx) => {
                            const shift = user.shifts?.[day.fullDate];
                            const isToday = day.fullDate === todayIso;
                            const isMonday = day.name === 'Seg';
                            
                            return (
                              <td 
                                key={`${day.fullDate}-${dIdx}`} 
                                className={`p-1.5 text-center border-r border-slate-300 relative ${isToday ? "bg-blue-50/50" : ""} ${isMonday ? "border-l-2 border-l-slate-400" : ""}`}
                              >
                                {shift ? (
                                  <div className={`flex flex-col items-center justify-center p-2 rounded transition-all w-full min-h-[50px] border ${
                                    shift.type === 'DSR' 
                                      ? "bg-green-600 border-green-700 text-white shadow-sm" 
                                      : shift.type === 'FOLGA' 
                                        ? "bg-slate-50 border-slate-200 text-slate-500" 
                                        : `${shift.color || 'bg-blue-500'} text-white shadow-sm border-transparent`
                                  }`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{shift.type}</span>
                                    {shift.startTime !== '-' && (
                                      <span className="text-[11px] font-bold mt-1 opacity-90">{shift.startTime}</span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center min-h-[50px]">
                                    <span className="text-slate-300 font-medium italic text-xs">--</span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
    </div>
  );
}

function ShiftOption({
  label,
  time,
  color,
  onClick,
}: {
  label: string;
  time: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-2xl border border-slate-100 hover:border-blue-600 hover:shadow-md transition-all text-left flex items-center gap-4 group"
    >
      <div
        className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white`}
      >
        <Clock size={20} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{time}</p>
      </div>
    </button>
  );
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 transition-colors">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  );
}

function EquipesContent({
  showNotification,
  adminUid,
  isadmin,
}: {
  showNotification: any;
  adminUid: string;
  isadmin?: boolean;
}) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showTeamForm, setShowTeamForm] = React.useState(false);
  const [editingTeam, setEditingTeam] = React.useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [draggedTeamId, setDraggedTeamId] = React.useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = React.useState("");

  const [shareTeamId, setShareTeamId] = React.useState<string | null>(null);
  const [shareEmail, setShareEmail] = React.useState("");
  const [shareRequests, setShareRequests] = React.useState<ShareRequest[]>([]);
  const currentUser = auth.currentUser;

  const [newTeam, setNewTeam] = React.useState({
    name: "",
    workload: 44,
    description: "",
    department: "",
    color: "#3b82f6",
    active: true,
    schedule: {
      seg: "08:00-17:00",
      ter: "08:00-17:00",
      qua: "08:00-17:00",
      qui: "08:00-17:00",
      sex: "08:00-17:00",
      sab: "08:00-12:00",
      dom: "FOLGA",
    },
  });

  React.useEffect(() => {
    if (!adminUid) return;
    setIsLoading(true);
    let teamsLoaded = false;
    let usersLoaded = false;

    const checkLoading = () => {
      if (teamsLoaded && usersLoaded) {
        setIsLoading(false);
      }
    };

    const unsubTeams = scaleService.subscribeToTeams((fetchedTeams) => {
      setTeams(fetchedTeams.sort((a, b) => (a.order || 0) - (b.order || 0)));
      teamsLoaded = true;
      checkLoading();
    });
    const unsubUsers = scaleService.subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
      usersLoaded = true;
      checkLoading();
    });

    let unsubShare = () => {};
    if (currentUser?.email) {
      unsubShare = scaleService.subscribeToShareRequests(
        currentUser.email,
        setShareRequests,
      );
    }

    return () => {
      unsubTeams();
      unsubUsers();
      unsubShare();
    };
  }, [adminUid, currentUser]);

  const handleShareTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareTeamId || !shareEmail || !currentUser?.email) return;

    setIsSubmitting(true);
    try {
      const team = teams.find((t) => t.id === shareTeamId);
      if (team) {
        await scaleService.createShareRequest({
          fromAdminId: currentUser.uid,
          fromAdminEmail: currentUser.email,
          toAdminEmail: shareEmail,
          teamId: team.id!,
          teamName: team.name,
        });
        setShareTeamId(null);
        setShareEmail("");
        showNotification(
          "Solicitação de compartilhamento enviada com sucesso!",
        );
      }
    } catch (error) {
      showNotification("Erro ao compartilhar equipe.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptShare = async (request: ShareRequest) => {
    if (!currentUser) return;
    try {
      await scaleService.acceptShareRequest(
        request.id!,
        request.teamId,
        currentUser.uid,
      );
      showNotification("Equipe adicionada com sucesso!");
    } catch (error) {
      // Error handled silently
    }
  };

  const handleRejectShare = async (requestId: string) => {
    try {
      await scaleService.rejectShareRequest(requestId);
    } catch (error) {
      // Error handled silently
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTeamId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTeamId || draggedTeamId === targetId) return;

    const newTeams = [...teams];
    const draggedIndex = newTeams.findIndex((t) => t.id === draggedTeamId);
    const targetIndex = newTeams.findIndex((t) => t.id === targetId);

    const [draggedTeam] = newTeams.splice(draggedIndex, 1);
    newTeams.splice(targetIndex, 0, draggedTeam);

    const updatedTeams = newTeams.map((t, index) => ({ ...t, order: index }));
    setTeams(updatedTeams);

    try {
      await Promise.all(
        updatedTeams.map((t) =>
          scaleService.updateTeam(t.id!, { order: t.order }),
        ),
      );
    } catch (error) {
      // Error handled silently
    }
    setDraggedTeamId(null);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await scaleService.createTeam({ ...newTeam, order: teams.length });
      setShowTeamForm(false);
      setNewTeam({
        name: "",
        workload: 44,
        description: "",
        department: "",
        color: "#3b82f6",
        active: true,
        schedule: {
          seg: "08:00-17:00",
          ter: "08:00-17:00",
          qua: "08:00-17:00",
          qui: "08:00-17:00",
          sex: "08:00-17:00",
          sab: "08:00-12:00",
          dom: "FOLGA",
        },
      });
    } catch (error) {
      showNotification("Erro ao criar equipe", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam?.id) return;
    setIsSubmitting(true);
    try {
      await scaleService.updateTeam(editingTeam.id, {
        schedule: editingTeam.schedule,
        workload: editingTeam.workload,
        name: editingTeam.name,
        leaderId: editingTeam.leaderId,
        description: editingTeam.description,
        department: editingTeam.department,
        color: editingTeam.color,
        active: editingTeam.active,
      });
      setEditingTeam(null);
    } catch (error) {
      showNotification("Erro ao atualizar equipe", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUserToTeam = async (userId: string) => {
    if (!editingTeam?.id) return;
    try {
      await scaleService.updateUserProfile(userId, { teamId: editingTeam.id });
    } catch (error) {
      showNotification("Erro ao adicionar usuário à equipe", "error");
    }
  };

  const handleRemoveUserFromTeam = async (userId: string) => {
    try {
      await scaleService.updateUserProfile(userId, { teamId: "" });
    } catch (error) {
      showNotification("Erro ao remover usuário da equipe", "error");
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta equipe?")) return;
    try {
      await scaleService.deleteTeam(id);
    } catch (error) {
      showNotification("Erro ao excluir equipe", "error");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const days = [
    { key: "seg", label: "Segunda" },
    { key: "ter", label: "Terça" },
    { key: "qua", label: "Quarta" },
    { key: "qui", label: "Quinta" },
    { key: "sex", label: "Sexta" },
    { key: "sab", label: "Sábado" },
    { key: "dom", label: "Domingo" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-slate-200 rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-slate-200 rounded-2xl animate-pulse"></div>
          <div className="h-48 bg-slate-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (editingTeam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setEditingTeam(null)}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Editar Equipe: {editingTeam.name}
            </h2>
            <p className="text-slate-500 text-sm">
              Configure os detalhes avançados, escala e membros.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateTeam} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 transition-colors">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings size={20} className="text-blue-600" />
                  Configurações Gerais
                </h3>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      Nome da Equipe
                    </label>
                    <input
                      required
                      type="text"
                      value={editingTeam.name}
                      onChange={(e) =>
                        setEditingTeam({ ...editingTeam, name: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      Líder da Equipe
                    </label>
                    <select
                      value={editingTeam.leaderId || ""}
                      onChange={(e) =>
                        setEditingTeam({
                          ...editingTeam,
                          leaderId: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors"
                    >
                      <option value="">Selecione um líder</option>
                      {users
                        .filter((u) => u.teamId === editingTeam.id)
                        .map((member) => (
                          <option key={member.uid} value={member.uid}>
                            {member.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Members Management */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 transition-colors">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  Membros da Equipe
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Colaboradores Atuais
                    </label>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {users
                        .filter((u) => u.teamId === editingTeam.id)
                        .sort((a, b) => {
                          const aIsLeader = a.uid === editingTeam.leaderId;
                          const bIsLeader = b.uid === editingTeam.leaderId;
                          const aIsAdmin = a.role === "admin" || a.isadmin || (editingTeam.sharedWith && editingTeam.sharedWith.includes(a.uid));
                          const bIsAdmin = b.role === "admin" || b.isadmin || (editingTeam.sharedWith && editingTeam.sharedWith.includes(b.uid));

                          if (aIsLeader && !bIsLeader) return -1;
                          if (!aIsLeader && bIsLeader) return 1;
                          if (aIsAdmin && !bIsAdmin) return -1;
                          if (!aIsAdmin && bIsAdmin) return 1;
                          return a.name.localeCompare(b.name);
                        })
                        .map((member) => {
                          const isLeader = member.uid === editingTeam.leaderId;
                          const isAdminOfTeam = (member.role === "admin" || member.isadmin || (editingTeam.sharedWith && editingTeam.sharedWith.includes(member.uid)));
                          
                          return (
                            <div
                              key={member.uid}
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                  {getInitials(member.name)}
                                </div>
                                <div className="flex flex-col">
                                  <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                                    {member.name}
                                    {isLeader && (
                                      <span title="Líder Principal">
                                        <Crown size={12} className="text-amber-500" />
                                      </span>
                                    )}
                                  </p>
                                  <div className="flex gap-1">
                                    <span className="text-[10px] text-slate-500 uppercase font-medium">
                                      {member.role === "admin" || member.isadmin ? "Administrador" : "Colaborador"}
                                    </span>
                                    {!isLeader && isAdminOfTeam && (
                                      <span className="text-[10px] text-blue-600 uppercase font-black">
                                        • Líder
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const isCurrentlyAdmin = member.isadmin || member.role === 'admin';
                                      await scaleService.updateUserProfile(member.uid, { 
                                        role: isCurrentlyAdmin ? 'collaborator' : 'admin',
                                        isadmin: !isCurrentlyAdmin 
                                      });
                                      
                                      const currentSharedWith = editingTeam.sharedWith || [];
                                      let newSharedWith = [...currentSharedWith];
                                      
                                      if (!isCurrentlyAdmin) {
                                        if (!newSharedWith.includes(member.uid)) {
                                          newSharedWith.push(member.uid);
                                        }
                                      } else {
                                        newSharedWith = newSharedWith.filter(id => id !== member.uid);
                                      }
                                      
                                      await scaleService.updateTeam(editingTeam.id!, { 
                                        sharedWith: newSharedWith 
                                      });
                                      
                                      showNotification(isCurrentlyAdmin ? "Acesso de líder removido" : "Usuário promovido a líder da equipe!");
                                    } catch (e) {
                                      showNotification("Erro ao atualizar", "error");
                                    }
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${isAdminOfTeam ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:bg-slate-200"}`}
                                  title={isAdminOfTeam ? "Remover admin/líder" : "Tornar Líder/Admin"}
                                >
                                  <Shield size={18} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingTeam({
                                      ...editingTeam,
                                      leaderId: member.uid,
                                    })
                                  }
                                  className={`p-2 rounded-lg transition-colors ${editingTeam.leaderId === member.uid ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:bg-slate-200"}`}
                                  title="Definir como líder principal"
                                >
                                  <Crown size={18} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveUserFromTeam(member.uid)
                                  }
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remover da equipe"
                                >
                                  <UserMinus size={18} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      {users.filter((u) => u.teamId === editingTeam.id)
                        .length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-8">
                          Nenhum membro nesta equipe.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Adicionar Novos Membros
                    </label>
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors"
                      />
                    </div>
                    <div className="space-y-1 max-h-[340px] overflow-y-auto pr-2">
                      {users
                        .filter(
                          (u) =>
                            u.teamId !== editingTeam.id &&
                            u.name
                              .toLowerCase()
                              .includes(userSearchTerm.toLowerCase()),
                        )
                        .map((user) => (
                          <div
                            key={user.uid}
                            className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                {getInitials(user.name)}
                              </div>
                              <span className="text-sm font-medium text-slate-700">
                                {user.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddUserToTeam(user.uid)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <UserPlus size={18} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 transition-colors">
                <h3 className="text-lg font-bold text-slate-900">Ações</h3>
                <div className="space-y-3">
                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTeam(null)}
                    className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-4 transition-colors">
                <div className="flex items-center gap-2 text-amber-700">
                  <Shield size={20} />
                  <h3 className="font-bold">Dica de Gestão</h3>
                </div>
                <p className="text-xs text-amber-600 leading-relaxed">
                  Definir um líder ajuda na organização da escala. O líder terá
                  visibilidade privilegiada sobre as folgas e trocas da equipe.
                </p>
              </div>

              {(editingTeam.ownerId === currentUser?.uid || isadmin) && (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4 transition-colors">
                  <div className="flex items-center gap-2 text-red-700">
                    <Trash2 size={20} />
                    <h3 className="font-bold">Zona de Perigo</h3>
                  </div>
                  <p className="text-xs text-red-600 leading-relaxed">
                    A exclusão de uma equipe é irreversível. Todos os membros
                    ficarão sem equipe vinculada.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteTeam(editingTeam.id!);
                      setEditingTeam(null);
                    }}
                    className="w-full py-2.5 bg-white text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all"
                  >
                    Excluir Equipe
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Equipes</h2>
          <p className="text-slate-500 text-sm">
            Gerencie seus colaboradores e departamentos.
          </p>
        </div>
        <button
          onClick={() => setShowTeamForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus size={18} /> Nova Equipe
        </button>
      </div>

      {/* Modal Criar Equipe */}
      <Modal
        isOpen={showTeamForm}
        onClose={() => setShowTeamForm(false)}
        title="Cadastrar Nova Equipe"
      >
        <form onSubmit={handleCreateTeam} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">
                Nome da Equipe
              </label>
              <input
                required
                type="text"
                value={newTeam.name}
                onChange={(e) =>
                  setNewTeam({ ...newTeam, name: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors"
                placeholder="Ex: TI Suporte"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowTeamForm(false)}
              className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isSubmitting ? "Criando..." : "Criar Equipe"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!shareTeamId}
        onClose={() => setShareTeamId(null)}
        title="Compartilhar Equipe"
      >
        <form onSubmit={handleShareTeam} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              E-mail do Administrador
            </label>
            <input
              required
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors"
              placeholder="admin@empresa.com"
            />
            <p className="text-xs text-slate-500">
              O administrador receberá uma solicitação para acessar esta equipe.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShareTeamId(null)}
              className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isSubmitting ? "Enviando..." : "Compartilhar"}
            </button>
          </div>
        </form>
      </Modal>

      {shareRequests.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 space-y-4 transition-colors">
          <div className="flex items-center gap-2 text-blue-800">
            <Bell size={20} />
            <h3 className="font-bold">Solicitações de Compartilhamento</h3>
          </div>
          <div className="space-y-3">
            {shareRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-4 rounded-xl border border-blue-100 flex items-center justify-between shadow-sm transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Equipe: {req.teamName}
                  </p>
                  <p className="text-xs text-slate-500">
                    Enviado por: {req.fromAdminEmail}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptShare(req)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all"
                  >
                    Aceitar
                  </button>
                  <button
                    onClick={() => handleRejectShare(req.id!)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {teams.map((team) => (
          <div
            key={team.id}
            draggable
            onDragStart={(e) => handleDragStart(e, team.id!)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, team.id!)}
            className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-move flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${draggedTeamId === team.id ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 shrink-0 flex items-center justify-center text-blue-600">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {team.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {users.filter((u) => u.teamId === team.id).length}{" "}
                  colaboradores
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
              <button
                onClick={() => setEditingTeam(team)}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap"
              >
                Configurar Escala
              </button>

              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                {team.ownerId === currentUser?.uid && (
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/join?teamId=${team.id}`;
                      navigator.clipboard.writeText(link);
                      showNotification(
                        "Link de convite copiado para a área de transferência!",
                      );
                    }}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                    title="Copiar Link de Convite"
                  >
                    <LinkIcon size={18} />
                  </button>
                )}
                {team.ownerId === currentUser?.uid && (
                  <button
                    onClick={() => setShareTeamId(team.id!)}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                    title="Compartilhar Equipe"
                  >
                    <Share2 size={18} />
                  </button>
                )}
                <button
                  onClick={() => setEditingTeam(team)}
                  className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                  title="Editar Equipe"
                >
                  <Edit size={18} />
                </button>
                {(team.ownerId === currentUser?.uid || isadmin) && (
                  <button
                    onClick={() => handleDeleteTeam(team.id!)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                    title="Excluir Equipe"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AvisosContent({
  showNotification,
  adminUid,
}: {
  showNotification: any;
  adminUid: string;
}) {
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = React.useState("");

  const [newAlert, setNewAlert] = React.useState({
    title: "",
    message: "",
    targetAudience: "all" as "all" | "team" | "user",
    targetId: "",
    priority: "Normal",
    sendMode: "now" as "now" | "schedule",
    scheduledDate: "",
    scheduledTime: "",
    sendPush: true,
  });

  React.useEffect(() => {
    if (!adminUid) return;
    setIsLoading(true);
    let alertsLoaded = false;
    let teamsLoaded = false;
    let usersLoaded = false;

    const checkLoading = () => {
      if (alertsLoaded && teamsLoaded && usersLoaded) setIsLoading(false);
    };

    const unsubAlerts = scaleService.subscribeToAdminAlerts((data) => {
      setAlerts(data);
      alertsLoaded = true;
      checkLoading();
    });
    const unsubTeams = scaleService.subscribeToTeams((data) => {
      setTeams(data);
      teamsLoaded = true;
      checkLoading();
    });
    const unsubUsers = scaleService.subscribeToUsers((data) => {
      setUsers(data);
      usersLoaded = true;
      checkLoading();
    });
    return () => {
      unsubAlerts();
      unsubTeams();
      unsubUsers();
    };
  }, [adminUid]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (!newAlert.title || !newAlert.message) return;
    if (newAlert.targetAudience !== "all" && !newAlert.targetId) {
      setStatusMessage({ type: "error", text: "Selecione o destinatário." });
      return;
    }

    setIsSubmitting(true);
    try {
      let scheduledForTimestamp: number | undefined = undefined;

      if (newAlert.sendMode === "schedule") {
        if (!newAlert.scheduledDate || !newAlert.scheduledTime) {
          setStatusMessage({
            type: "error",
            text: "Preencha a data e o horário para agendar.",
          });
          setIsSubmitting(false);
          return;
        }

        const dateObj = new Date(
          `${newAlert.scheduledDate}T${newAlert.scheduledTime}`,
        );
        if (!isNaN(dateObj.getTime())) {
          if (dateObj.getTime() <= Date.now()) {
            setStatusMessage({
              type: "error",
              text: "A data de agendamento deve ser no futuro.",
            });
            setIsSubmitting(false);
            return;
          }
          scheduledForTimestamp = dateObj.getTime();
        } else {
          setStatusMessage({
            type: "error",
            text: "Data ou horário inválidos.",
          });
          setIsSubmitting(false);
          return;
        }
      }

      const isScheduled = !!scheduledForTimestamp;

      const getTokensAndWhatsApp = (userObj: UserProfile) => {
        const tokens: string[] = [];
        if (userObj.fcmTokens && Array.isArray(userObj.fcmTokens)) {
          userObj.fcmTokens.forEach((t: any) => {
            if (typeof t === "string") tokens.push(t);
            else if (t && typeof t === "object" && t.token)
              tokens.push(t.token);
          });
        }
        if (userObj.fcmToken && typeof userObj.fcmToken === "string") {
          tokens.push(userObj.fcmToken);
        }
        return {
          tokens: Array.from(new Set(tokens)),
          whatsapp: userObj.whatsapp || "",
        };
      };

      if (newAlert.targetAudience === "user") {
        const u = users.find((u) => u.uid === newAlert.targetId);
        if (u) {
          const { tokens, whatsapp } = getTokensAndWhatsApp(u);
          await scaleService.createAlert({
            title: newAlert.title,
            message: newAlert.message,
            targetAudience: "user",
            targetId: u.uid,
            createdBy: auth.currentUser?.uid || "admin",
            scheduledFor: scheduledForTimestamp,
            recipientWhatsApp: whatsapp,
            recipientTokens: tokens,
          });

          if (newAlert.sendPush && !isScheduled && tokens.length > 0) {
            pushService
              .sendToMultiple(tokens, newAlert.title, newAlert.message)
              .catch(() => {});
          }
        }
      } else if (newAlert.targetAudience === "team") {
        const teamUsers = users.filter((u) => u.teamId === newAlert.targetId);
        const allTokens: string[] = [];

        for (const u of teamUsers) {
          const { tokens, whatsapp } = getTokensAndWhatsApp(u);
          await scaleService.createAlert({
            title: newAlert.title,
            message: newAlert.message,
            targetAudience: "user", // We save as individual for the bot to pick up
            targetId: u.uid,
            createdBy: auth.currentUser?.uid || "admin",
            scheduledFor: scheduledForTimestamp,
            recipientWhatsApp: whatsapp,
            recipientTokens: tokens,
          });
          tokens.forEach((t) => allTokens.push(t));
        }

        const uniqueTokens = Array.from(new Set(allTokens));
        if (newAlert.sendPush && !isScheduled && uniqueTokens.length > 0) {
          pushService
            .sendToMultiple(uniqueTokens, newAlert.title, newAlert.message)
            .catch(() => {});
        }
      } else {
        // Create individual alerts for EVERYONE for the bot to send private messages
        for (const u of users) {
          const { tokens, whatsapp } = getTokensAndWhatsApp(u);
          await scaleService.createAlert({
            title: newAlert.title,
            message: newAlert.message,
            targetAudience: "user",
            targetId: u.uid,
            createdBy: auth.currentUser?.uid || "admin",
            scheduledFor: scheduledForTimestamp,
            recipientWhatsApp: whatsapp,
            recipientTokens: tokens,
          });
        }

        // Create General alert for the bot to post in the GROUP
        await scaleService.createAlert({
          title: newAlert.title,
          message: newAlert.message,
          targetAudience: "all",
          targetId: "",
          createdBy: auth.currentUser?.uid || "admin",
          scheduledFor: scheduledForTimestamp,
          recipientWhatsApp: "GROUP",
          recipientTokens: [],
        });

        if (newAlert.sendPush && !isScheduled) {
          const allTokens: string[] = [];
          users.forEach((u) => {
            const { tokens } = getTokensAndWhatsApp(u);
            tokens.forEach((t) => allTokens.push(t));
          });
          const uniqueTokens = Array.from(new Set(allTokens));
          if (uniqueTokens.length > 0) {
            pushService
              .sendToMultiple(uniqueTokens, newAlert.title, newAlert.message)
              .catch(() => {});
          }
        }
      }

      setNewAlert({
        title: "",
        message: "",
        targetAudience: "all",
        targetId: "",
        priority: "Normal",
        sendMode: "now",
        scheduledDate: "",
        scheduledTime: "",
        sendPush: true,
      });
      setStatusMessage({
        type: "success",
        text: isScheduled
          ? "Aviso agendado com sucesso!"
          : "Aviso enviado com sucesso!",
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setStatusMessage({ type: "error", text: "Erro ao enviar aviso." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!id) return;

    // First click: prompts for confirmation via state
    if (deletingId !== id) {
      setDeletingId(id);

      // Auto-cancel confirmation after 4 seconds
      setTimeout(() => {
        setDeletingId((currentId) => (currentId === id ? null : currentId));
      }, 4000);
      return;
    }

    // Second click: actually delete
    setDeletingId(null);
    try {
      await scaleService.deleteAlert(id);
      // O onSnapshot cuidará de atualizar a lista automaticamente
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: "Erro ao excluir aviso. Verifique sua conexão.",
      });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-slate-200 rounded-2xl animate-pulse"></div>
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${statusMessage.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-800"}`}
        >
          <div
            className={`p-2 rounded-xl ${statusMessage.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}
          >
            {statusMessage.type === "success" ? (
              <Check size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
          </div>
          <span className="font-bold text-sm">{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="ml-auto opacity-60 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Form Column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                  <Edit size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Novo Aviso</h3>
                  <p className="text-slate-500 text-sm font-medium">Preencha os dados abaixo para comunicar sua equipe.</p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Recipient Type Toggle */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Tipo de Destinatário
                </label>
                <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl w-fit">
                  <button
                    onClick={() =>
                      setNewAlert({
                        ...newAlert,
                        targetAudience: "all",
                        targetId: "",
                      })
                    }
                    className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${newAlert.targetAudience === "all" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Geral
                  </button>
                  <button
                    onClick={() =>
                      setNewAlert({
                        ...newAlert,
                        targetAudience: "team",
                        targetId: "",
                      })
                    }
                    className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${newAlert.targetAudience === "team" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Equipe
                  </button>
                  <button
                    onClick={() =>
                      setNewAlert({
                        ...newAlert,
                        targetAudience: "user",
                        targetId: "",
                      })
                    }
                    className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${newAlert.targetAudience === "user" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Individual
                  </button>
                </div>
              </div>

              {/* Dynamic Selects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {newAlert.targetAudience === "team" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Selecionar Equipe
                    </label>
                    <select
                      value={newAlert.targetId}
                      onChange={(e) =>
                        setNewAlert({ ...newAlert, targetId: e.target.value })
                      }
                      className="w-full h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all px-4"
                    >
                      <option value="">Selecione uma equipe...</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {newAlert.targetAudience === "user" && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Pesquisar e Selecionar Colaborador
                    </label>
                    <div className="relative">
                      <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        placeholder="Digite o nome para buscar..."
                        className="w-full h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all pl-11 pr-4"
                      />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-none p-2 max-h-[400px] overflow-y-auto space-y-1">
                      {userSearchTerm.trim() === "" &&
                        newAlert.targetId === "" && (
                          <div className="p-4 text-center text-sm text-slate-500 font-medium">
                            Digite um nome para buscar colaboradores.
                          </div>
                        )}

                      {users
                        .filter((u) => {
                          if (userSearchTerm.trim() === "")
                            return u.uid === newAlert.targetId;
                          return u.name
                            .toLowerCase()
                            .includes(userSearchTerm.toLowerCase());
                        })
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((user) => (
                          <label
                            key={user.uid}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                              newAlert.targetId === user.uid
                                ? "bg-blue-100 text-blue-700 shadow-sm"
                                : "hover:bg-slate-200/50 text-slate-700"
                            }`}
                          >
                            <input
                              type="radio"
                              name="targetUser"
                              value={user.uid}
                              checked={newAlert.targetId === user.uid}
                              onChange={() =>
                                setNewAlert({ ...newAlert, targetId: user.uid })
                              }
                              className="hidden"
                            />
                            <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs uppercase flex-shrink-0">
                              {user.name.substring(0, 2)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold truncate">
                                {user.name}
                              </span>
                              <span className="text-[10px] opacity-70 truncate">
                                {user.email || "Sem email"}
                              </span>
                            </div>
                            {newAlert.targetId === user.uid && (
                              <CheckCircle2
                                className="ml-auto text-blue-600 flex-shrink-0"
                                size={18}
                              />
                            )}
                          </label>
                        ))}
                      {userSearchTerm.trim() !== "" &&
                        users.filter((u) =>
                          u.name
                            .toLowerCase()
                            .includes(userSearchTerm.toLowerCase()),
                        ).length === 0 && (
                          <div className="p-4 text-center text-sm text-slate-500 font-medium">
                            Nenhum colaborador encontrado.
                          </div>
                        )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Prioridade
                  </label>
                  <select
                    value={newAlert.priority}
                    onChange={(e) =>
                      setNewAlert({ ...newAlert, priority: e.target.value })
                    }
                    className="w-full h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all px-4"
                  >
                    <option>Normal</option>
                    <option>Urgente</option>
                    <option>Informativo</option>
                  </select>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Título do Aviso
                </label>
                <input
                  type="text"
                  value={newAlert.title}
                  onChange={(e) =>
                    setNewAlert({ ...newAlert, title: e.target.value })
                  }
                  placeholder="Ex: Manutenção programada do sistema"
                  className="w-full h-12 md:h-14 rounded-none border border-slate-200 bg-slate-50 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all px-4 xl:px-6"
                />
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Mensagem
                </label>
                <div className="bg-slate-50 rounded-3xl overflow-hidden transition-all">
                  <div className="px-4 py-2 flex gap-3">
                    <button type="button" className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
                      <Check size={18} />
                    </button>
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <button type="button" className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
                      <Plus size={18} />
                    </button>
                  </div>
                  <textarea
                    value={newAlert.message}
                    onChange={(e) =>
                      setNewAlert({ ...newAlert, message: e.target.value })
                    }
                    placeholder="Escreva o conteúdo detalhado do aviso aqui..."
                    rows={12}
                    className="w-full border-none focus:ring-0 bg-transparent text-sm font-medium px-6 pb-6 resize-none outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column: Scheduling & Preview */}
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Clock className="text-blue-600" size={16} />
              Envio
            </h3>

            {/* Mode selection */}
            <div className="flex p-1.5 bg-slate-100 rounded-2xl">
              <button
                onClick={() =>
                  setNewAlert({
                    ...newAlert,
                    sendMode: "now",
                    scheduledDate: "",
                    scheduledTime: "",
                  })
                }
                className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${newAlert.sendMode === "now" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                Enviar Agora
              </button>
              <button
                onClick={() =>
                  setNewAlert({ ...newAlert, sendMode: "schedule" })
                }
                className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${newAlert.sendMode === "schedule" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                Agendar
              </button>
            </div>

            <div className="space-y-4">
              {newAlert.sendMode === "schedule" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Data de Envio
                    </label>
                    <input
                      type="date"
                      value={newAlert.scheduledDate}
                      onChange={(e) =>
                        setNewAlert({
                          ...newAlert,
                          scheduledDate: e.target.value,
                        })
                      }
                      className="w-full h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 px-4 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={newAlert.scheduledTime}
                      onChange={(e) =>
                        setNewAlert({
                          ...newAlert,
                          scheduledTime: e.target.value,
                        })
                      }
                      className="w-full h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 px-4 transition-all"
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 py-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={newAlert.sendPush}
                    onChange={(e) =>
                      setNewAlert({ ...newAlert, sendPush: e.target.checked })
                    }
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                    Notificação Push
                  </span>
                  {newAlert.sendMode === "schedule" && (
                    <span className="text-[9px] text-orange-500 font-bold uppercase tracking-widest">
                      Não suportado p/ agendamento
                    </span>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCreateAlert}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 group text-sm"
            >
              <Bell size={18} />
              {isSubmitting
                ? "Processando..."
                : newAlert.sendMode === "now"
                  ? "Enviar Agora"
                  : "Agendar"}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Notices Table */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Avisos Recentes
          </h3>
          <button className="text-blue-600 text-sm font-bold hover:underline underline-offset-4 decoration-2">
            Ver todos
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Título
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Destinatário
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Data
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-8 py-16 text-center text-slate-400 font-medium italic"
                    >
                      Nenhum aviso enviado recentemente.
                    </td>
                  </tr>
                ) : (
                  alerts.slice(0, 10).map((alertItem) => (
                    <tr
                      key={alertItem.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {alertItem.title}
                          </span>
                          <span className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                            {alertItem.message}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ${
                            alertItem.targetAudience === "all"
                              ? "bg-blue-100 text-blue-700"
                              : alertItem.targetAudience === "team"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {alertItem.targetAudience === "all"
                            ? "Geral"
                            : alertItem.targetAudience === "team"
                              ? "Equipe"
                              : "Individual"}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1.5">
                          {alertItem.scheduledFor &&
                          alertItem.scheduledFor > Date.now() ? (
                            <div className="flex items-center gap-2 text-orange-600 font-black text-[11px] uppercase tracking-tight">
                              <Clock size={12} className="animate-pulse" />
                              Agendado
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-green-600 font-black text-[11px] uppercase tracking-tight">
                              <div className="size-2 bg-green-500 rounded-full"></div>
                              Sistema OK
                            </div>
                          )}

                          {alertItem.recipientWhatsApp && (
                            <div
                              className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${alertItem.isBotProcessed ? "text-emerald-500" : "text-slate-400"}`}
                            >
                              <div
                                className={`size-1.5 rounded-full ${alertItem.isBotProcessed ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-slate-300"}`}
                              ></div>
                              WhatsApp{" "}
                              {alertItem.isBotProcessed
                                ? "Enviado"
                                : "Pendente"}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-500 font-bold text-xs">
                        {new Date(
                          alertItem.scheduledFor || alertItem.createdAt,
                        ).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <button
                          onClick={() =>
                            alertItem.id && handleDeleteAlert(alertItem.id)
                          }
                          className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 max-w-[120px] ml-auto ${
                            deletingId === alertItem.id
                              ? "bg-red-500 text-white shadow-lg shadow-red-500/20 active:scale-95"
                              : "text-slate-400 hover:text-red-500 hover:bg-red-50 active:scale-90"
                          }`}
                          title={
                            deletingId === alertItem.id
                              ? "Clique novamente para confirmar"
                              : "Excluir"
                          }
                        >
                          <Trash2
                            size={deletingId === alertItem.id ? 16 : 20}
                          />
                          {deletingId === alertItem.id && (
                            <span className="text-xs font-bold leading-none animate-in fade-in slide-in-from-right-2">
                              Confirmar
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function CadastrarContent({
  onSuccess,
  showNotification,
}: {
  onSuccess: () => void;
  showNotification: any;
}) {
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [newUser, setNewUser] = React.useState({
    name: "",
    email: "",
    password: "",
    whatsapp: "",
    role: "collaborator" as "admin" | "collaborator",
    teamId: "",
    admissionDate: "",
    company: "MELI",
    contract: "MELI",
  });

  React.useEffect(() => {
    const unsubTeams = scaleService.subscribeToTeams(setTeams);
    return () => unsubTeams();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newUser.email,
        newUser.password,
      );
      const user = userCredential.user;

      await scaleService.createUserProfile({
        uid: user.uid,
        email: newUser.email,
        name: newUser.name,
        whatsapp: newUser.whatsapp,
        role: newUser.role,
        isadmin: newUser.role === "admin",
        teamId: newUser.teamId,
        initialPassword: newUser.password,
        admissionDate: newUser.admissionDate,
        company: newUser.company,
        contract: newUser.contract,
        createdAt: Date.now(),
      });

      await signOut(secondaryAuth); // Sign out the secondary app so it doesn't interfere
      showNotification("Usuário cadastrado com sucesso!");
      setNewUser({
        name: "",
        email: "",
        password: "",
        whatsapp: "",
        role: "collaborator",
        teamId: "",
        admissionDate: "",
        company: "MELI",
        contract: "MELI",
      });
      onSuccess();
    } catch (error: any) {
      showNotification("Erro ao cadastrar usuário: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Cadastrar Novo Usuário
        </h2>
        <p className="text-slate-500 text-sm">
          Crie novos acessos para administradores ou colaboradores.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-colors">
        <form onSubmit={handleCreateUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">
                Nome Completo
              </label>
              <input
                required
                type="text"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                placeholder="Ex: João Silva"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">
                E-mail de Acesso
              </label>
              <input
                required
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                placeholder="email@empresa.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">
                Senha Provisória
              </label>
              <input
                required
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">
                WhatsApp
              </label>
              <input
                type="text"
                value={newUser.whatsapp}
                onChange={(e) =>
                  setNewUser({ ...newUser, whatsapp: e.target.value })
                }
                placeholder="Ex: 11988887777"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">
                Equipe Responsável
              </label>
              <select
                value={newUser.teamId}
                onChange={(e) =>
                  setNewUser({ ...newUser, teamId: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-all"
              >
                <option value="">Sem Equipe (Apenas Admin)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">
                Perfil de Acesso
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setNewUser({ ...newUser, role: "collaborator" })
                  }
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    newUser.role === "collaborator"
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-100 bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-bold ${newUser.role === "collaborator" ? "text-blue-600" : "text-slate-900"}`}
                    >
                      Colaborador
                    </span>
                    {newUser.role === "collaborator" && (
                      <CheckCircle2 size={18} className="text-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Acesso apenas à visualização de escalas mobile.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setNewUser({ ...newUser, role: "admin" })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    newUser.role === "admin"
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-100 bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-bold ${newUser.role === "admin" ? "text-blue-600" : "text-slate-900"}`}
                    >
                      Administrador
                    </span>
                    {newUser.role === "admin" && (
                      <CheckCircle2 size={18} className="text-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Acesso total ao painel de gestão e escalas.
                  </p>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              disabled={isSubmitting}
              type="submit"
              className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Cadastrando...
                </>
              ) : (
                "Cadastrar Usuário"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsuariosContent({
  showNotification,
  adminUid,
}: {
  showNotification: any;
  adminUid: string;
}) {
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [editingUser, setEditingUser] = React.useState<UserProfile | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>("all");
  const [activeSubTab, setActiveSubTab] = React.useState<
    "listar" | "cadastrar"
  >("listar");
  const [activeActionMenu, setActiveActionMenu] = React.useState<string | null>(
    null,
  );
  const currentUser = auth.currentUser;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam =
      selectedTeamId === "all" || user.teamId === selectedTeamId;
    return matchesSearch && matchesTeam;
  });

  React.useEffect(() => {
    if (!adminUid) return;
    setIsLoading(true);
    let usersLoaded = false;
    let teamsLoaded = false;

    const checkLoading = () => {
      if (usersLoaded && teamsLoaded) setIsLoading(false);
    };

    const unsubUsers = scaleService.subscribeToUsers((data) => {
      setUsers(data);
      usersLoaded = true;
      checkLoading();
    });
    const unsubTeams = scaleService.subscribeToTeams((data) => {
      setTeams(data);
      teamsLoaded = true;
      checkLoading();
    });
    return () => {
      unsubUsers();
      unsubTeams();
    };
  }, [adminUid]);

  const handleDeleteUser = async (uid: string) => {
    // Usando confirm do próprio navegador por enquanto pois é destrutivo, mas tirando alert de erro
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      await scaleService.deleteUser(uid);
      showNotification("Usuário excluído com sucesso!");
    } catch (error) {
      showNotification("Erro ao excluir usuário", "error");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await scaleService.updateUserProfile(editingUser.uid, {
        name: editingUser.name,
        role: editingUser.role,
        teamId: editingUser.teamId,
        isadmin: editingUser.role === "admin",
        whatsapp: editingUser.whatsapp,
        admissionDate: editingUser.admissionDate,
        company: editingUser.company,
        contract: editingUser.contract,
      });
      setEditingUser(null);
    } catch (error) {
      showNotification("Erro ao atualizar usuário", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-slate-200 rounded-2xl animate-pulse"></div>
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveSubTab("listar")}
          className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeSubTab === "listar" ? "text-blue-600 border-blue-600" : "text-slate-500 hover:text-slate-900 border-transparent"}`}
        >
          Listar Usuários
        </button>
        <button
          onClick={() => setActiveSubTab("cadastrar")}
          className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeSubTab === "cadastrar" ? "text-blue-600 border-blue-600" : "text-slate-500 hover:text-slate-900 border-transparent"}`}
        >
          Cadastrar Colaborador
        </button>
      </div>

      {activeSubTab === "cadastrar" ? (
        <CadastrarContent
          showNotification={showNotification}
          onSuccess={() => setActiveSubTab("listar")}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Usuários</h2>
              <p className="text-slate-500 text-sm">
                Gerencie os acessos e perfis do sistema.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 w-full sm:w-64 transition-colors"
              />
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 w-full sm:w-auto transition-colors"
              >
                <option value="all">Todas as Equipes</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Editar Usuário */}
          <Modal
            isOpen={!!editingUser}
            onClose={() => setEditingUser(null)}
            title="Editar Perfil do Usuário"
          >
            {editingUser && (
              <form onSubmit={handleUpdateUser} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      Nome Completo
                    </label>
                    <input
                      required
                      type="text"
                      value={editingUser.name}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, name: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">
                        Equipe
                      </label>
                      <select
                        value={editingUser.teamId || ""}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            teamId: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors"
                      >
                        <option value="">Sem Equipe</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">
                        Perfil
                      </label>
                      <select
                        value={editingUser.role}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            role: e.target.value as "admin" | "collaborator",
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors"
                      >
                        <option value="collaborator">Colaborador</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      value={editingUser.whatsapp || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          whatsapp: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                  >
                    {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            )}
          </Modal>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-colors">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase">
                      Usuário
                    </th>
                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase">
                      E-mail
                    </th>
                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase">
                      WhatsApp
                    </th>
                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase">
                      Senha Inicial
                    </th>
                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase">
                      Perfil
                    </th>
                    <th className="p-4 text-center text-xs font-bold text-slate-400 uppercase">
                      Acesso/Devices
                    </th>
                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase">
                      Equipe
                    </th>
                    <th className="p-4 text-right text-xs font-bold text-slate-400 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.uid}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 text-sm font-semibold text-slate-900">
                        {user.name}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {user.email}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {user.whatsapp || "---"}
                      </td>
                      <td className="p-4 text-sm font-mono text-slate-500">
                        {user.initialPassword || "---"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center -space-x-1.5 focus-within:z-10">
                          {user.fcmTokens &&
                          Array.isArray(user.fcmTokens) &&
                          user.fcmTokens.length > 0 ? (
                            user.fcmTokens.slice(0, 3).map((token: any, i) => (
                              <div
                                key={i}
                                title={
                                  typeof token === "string"
                                    ? "Token Legado"
                                    : `${token.deviceName} - Ativo em: ${new Date(token.lastActive).toLocaleString()}`
                                }
                                className="size-7 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[8px] text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all cursor-help"
                              >
                                <Smartphone size={10} />
                              </div>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">
                              Nenhum Device
                            </span>
                          )}
                          {user.fcmTokens && user.fcmTokens.length > 3 && (
                            <div className="size-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] text-slate-500 font-bold">
                              +{user.fcmTokens.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {teams.find((t) => t.id === user.teamId)?.name || "N/A"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Editar Usuário"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.uid)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title="Excluir Usuário"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <div
                  key={user.uid}
                  className="p-4 space-y-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900">{user.name}</h3>
                      <p className="text-xs text-slate-500">{user.email}</p>
                      {user.whatsapp && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">WhatsApp: {user.whatsapp}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block uppercase font-bold">
                        Equipe
                      </span>
                      <span className="text-slate-700">
                        {teams.find((t) => t.id === user.teamId)?.name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold">
                        Senha Inicial
                      </span>
                      <span className="text-slate-700 font-mono">
                        {user.initialPassword || "---"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      <Edit size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.uid)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RelatoriosContent({ showNotification }: { showNotification: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Relatórios</h2>
        <p className="text-slate-500 text-sm">
          Analise a performance e custos da sua operação.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Horas Trabalhadas vs. Planejadas
          </h3>
          <div className="h-64 bg-slate-50 rounded-lg flex items-end justify-around p-4 gap-2 transition-colors">
            {[40, 65, 45, 90, 55, 70, 85].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className="w-full bg-blue-600/20 rounded-t-md relative group"
                  style={{ height: `${h}%` }}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 bg-blue-600 rounded-t-md"
                    style={{ height: "80%" }}
                  ></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {h}h
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Seg
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Distribuição de Turnos
          </h3>
          <div className="flex items-center justify-center h-64">
            <div className="relative w-48 h-48 rounded-full border-[16px] border-slate-100 flex items-center justify-center transition-colors">
              <div className="absolute inset-0 rounded-full border-[16px] border-blue-600 border-t-transparent border-r-transparent rotate-45"></div>
              <div className="absolute inset-0 rounded-full border-[16px] border-indigo-500 border-b-transparent border-l-transparent -rotate-12"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">142</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Total
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            <LegendItem color="bg-blue-600" label="MANHÃ" />
            <LegendItem color="bg-indigo-500" label="TARDE" />
            <LegendItem color="bg-slate-800" label="NOITE" />
            <LegendItem color="bg-green-600" label="DSR" />
            <LegendItem color="bg-red-600" label="FALTA" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Resumo Mensal</h3>
          <button className="text-blue-600 text-sm font-bold flex items-center gap-1">
            Ver tudo <ChevronDown size={16} />
          </button>
        </div>
        <div className="space-y-4">
          <ReportRow
            label="Total de Horas Extras"
            value="124h"
            trend="+12%"
            positive={false}
          />
          <ReportRow
            label="Custo Operacional"
            value="R$ 42.500"
            trend="-3%"
            positive={true}
          />
          <ReportRow
            label="Taxa de Absenteísmo"
            value="2.4%"
            trend="-0.5%"
            positive={true}
          />
        </div>
      </div>
    </div>
  );
}

function ConfiguracoesContent({ showNotification }: { showNotification: any }) {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
        <p className="text-slate-500 text-sm">
          Ajuste as preferências do sistema e da sua conta.
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Shield size={16} /> Segurança & Acesso
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 transition-colors">
            <ConfigRow
              title="Autenticação em Duas Etapas"
              description="Adicione uma camada extra de segurança à sua conta."
              action={
                <button className="text-blue-600 text-sm font-bold">
                  Ativar
                </button>
              }
            />
            <ConfigRow
              title="Alterar Senha"
              description="Atualize sua senha periodicamente para manter sua conta segura."
              action={
                <button className="text-slate-600 text-sm font-bold">
                  Alterar
                </button>
              }
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Bell size={16} /> Notificações
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 transition-colors">
            <ConfigToggle
              title="E-mail"
              description="Receba alertas de gaps e novas solicitações por e-mail."
              defaultChecked
            />
            <ConfigToggle
              title="Push (Mobile)"
              description="Notificações em tempo real no aplicativo mobile."
              defaultChecked
            />
            <ConfigToggle
              title="SMS"
              description="Alertas críticos via SMS para gestores."
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Settings size={16} /> Sistema
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  Fuso Horário
                </label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors">
                  <option>(GMT-03:00) Brasília</option>
                  <option>(GMT-05:00) Eastern Time</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  Idioma
                </label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors">
                  <option>Português (Brasil)</option>
                  <option>English (US)</option>
                </select>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all">
                Salvar Alterações
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReportRow({
  label,
  value,
  trend,
  positive,
}: {
  label: string;
  value: string;
  trend: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-slate-900">{value}</span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded ${positive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
        >
          {trend}
        </span>
      </div>
    </div>
  );
}

function PerfilContent({
  user,
  showNotification,
}: {
  user?: UserProfile;
  showNotification: any;
}) {
  const [formData, setFormData] = React.useState({
    name: user?.name || "",
    admissionDate: user?.admissionDate || "",
    company: user?.company || "",
    contract: user?.contract || "",
  });
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        admissionDate: user.admissionDate || "",
        company: user.company || "",
        contract: user.contract || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await scaleService.updateUserProfile(user.uid, {
        name: formData.name,
        admissionDate: formData.admissionDate,
        company: formData.company,
        contract: formData.contract,
      });
      showNotification("Perfil atualizado com sucesso!", "success");
    } catch (e) {
      showNotification("Erro ao atualizar perfil.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const pendencies = [];
  if (!formData.name) pendencies.push("Nome Completo");
  if (!formData.admissionDate) pendencies.push("Data de Admissão");
  if (!formData.company) pendencies.push("Empresa");
  if (!formData.contract) pendencies.push("Contrato");

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Meu Perfil</h2>
        <p className="text-slate-500 text-sm">
          Gerencie suas informações de administrador.
        </p>
      </div>

      {pendencies.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-amber-900">Informações Pendentes</h3>
            <p className="text-sm text-amber-700 mt-1">
              Os seguintes campos ainda não foram preenchidos:{" "}
              <span className="font-bold">{pendencies.join(", ")}</span>.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center overflow-hidden border border-blue-600/10 text-2xl font-bold text-blue-600">
            {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {user?.name || "Administrador"}
            </h3>
            <p className="text-sm text-slate-500">
              {user?.email || "admin@scale.com"}
            </p>
            <p className="text-xs font-bold text-blue-600 uppercase mt-1">
              {user?.role || "Administrador"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">E-mail</label>
            <input
              type="email"
              disabled
              value={user?.email || ""}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-sm outline-none text-slate-500 transition-colors cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Data de Admissão
            </label>
            <input
              type="date"
              value={formData.admissionDate}
              onChange={(e) =>
                setFormData({ ...formData, admissionDate: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Empresa</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
              placeholder="Ex: MELI"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Contrato</label>
            <input
              type="text"
              value={formData.contract}
              onChange={(e) =>
                setFormData({ ...formData, contract: e.target.value })
              }
              placeholder="Ex: CLT, PJ"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 text-slate-900 transition-colors"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all disabled:bg-slate-400"
          >
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfigRow({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="p-4 flex items-center justify-between border-b border-slate-50 last:border-0">
      <div>
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ConfigToggle({
  title,
  description,
  defaultChecked = false,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="p-4 flex items-center justify-between border-b border-slate-50 last:border-0">
      <div>
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "green" | "red" | "blue";
}) {
  const colors = {
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between transition-colors">
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <h3 className="text-2xl font-bold mt-1 text-slate-900">{value}</h3>
      </div>
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${colors[color]}`}
      >
        {icon}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded ${color}`}></div>
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </div>
  );
}

function getShiftColor(type: string, customColor?: string) {
  // If it's a standard type with a default blue color, we override it with its standard color
  if (customColor === "bg-blue-500" && (type === "DSR" || type === "FALTA")) {
    return type === "DSR" ? "bg-green-600" : "bg-red-600";
  }
  if (customColor && customColor.startsWith("bg-")) return customColor;
  switch (type) {
    case "MANHÃ":
      return "bg-blue-600";
    case "TARDE":
      return "bg-indigo-500";
    case "NOITE":
      return "bg-slate-800";
    case "FALTA":
      return "bg-red-600";
    case "DSR":
      return "bg-green-600";
    default:
      return "bg-slate-400";
  }
}

function LunchManager({
  users,
  teams,
  notifyUser,
  selectedWeek,
  currentWeekNum,
  showNotification,
}: {
  users: UserProfile[];
  teams: Team[];
  notifyUser: any;
  selectedWeek: number;
  currentWeekNum: number;
  showNotification: any;
}) {
  const [lunchGroups, setLunchGroups] = React.useState<string[]>([
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
  ]);
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);
  const [isAddingTime, setIsAddingTime] = React.useState(false);
  const [newTimeStart, setNewTimeStart] = React.useState("12:00");
  const [isAssigningUsers, setIsAssigningUsers] = React.useState(false);
  const [selectedUsersToAssign, setSelectedUsersToAssign] = React.useState<
    string[]
  >([]);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [userSearch, setUserSearch] = React.useState("");

  const isPreviousWeek = selectedWeek < currentWeekNum;

  const handlePublishLunch = async () => {
    if (isPreviousWeek) {
      showNotification("Semanas anteriores não podem ser editadas", "warning");
      return;
    }
    setIsPublishing(true);
    let notifiedCount = 0;
    try {
      const usersWithLunch = users.filter((u) => u.defaultLunchTime);
      for (const u of usersWithLunch) {
        try {
          await notifyUser(
            u,
            "Horário de Almoço Atualizado 🍽️",
            `Atenção! Seu novo horário de almoço foi definido para: ${u.defaultLunchTime}.`,
          );
          notifiedCount++;
        } catch (err) {
          // If one fails, continue to others
        }
      }
      showNotification(
        notifiedCount > 0 
          ? `${notifiedCount} usuários notificados sobre seus horários de almoço!` 
          : "Nenhum horário de almoço para publicar.",
        "success",
      );
    } catch (e) {
      showNotification("Erro ao publicar horários.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  // Load custom groups from settings for cross-device sync
  React.useEffect(() => {
    const unsub = scaleService.subscribeToSettings((settings) => {
      if (settings?.lunchGroups) {
        setLunchGroups(settings.lunchGroups);
      }
    });
    return () => unsub();
  }, []);

  const saveGroups = async (groups: string[]) => {
    setLunchGroups(groups);
    try {
      await scaleService.saveSettings({ lunchGroups: groups });
    } catch (e) {}
  };

  const handleAddGroup = () => {
    const endH = parseInt(newTimeStart.split(":")[0]) + 1;
    const finalStr = `${newTimeStart} - ${endH.toString().padStart(2, "0")}:${newTimeStart.split(":")[1]}`;
    if (!lunchGroups.includes(finalStr)) {
      saveGroups([...lunchGroups, finalStr]);
    }
    setIsAddingTime(false);
  };

  const handleDeleteGroup = async (group: string) => {
    if (isPreviousWeek) {
      showNotification("Semanas anteriores não podem ser editadas", "warning");
      return;
    }
    const usersInGroup = users.filter((u) => u.defaultLunchTime === group);
    if (usersInGroup.length > 0) {
      saveGroups(lunchGroups.filter((g) => g !== group)); // Still remove from group list
      await Promise.all(
        usersInGroup.map((u) =>
          scaleService.updateUserProfile(u.uid, { defaultLunchTime: null }),
        ),
      );
    } else {
      saveGroups(lunchGroups.filter((g) => g !== group));
    }
  };

  const handleAssignUsers = async () => {
    if (!selectedGroup) return;
    if (isPreviousWeek) {
      showNotification("Semanas anteriores não podem ser editadas", "warning");
      setIsAssigningUsers(false);
      return;
    }
    try {
      const promises = selectedUsersToAssign.map((uid) =>
        scaleService.updateUserProfile(uid, {
          defaultLunchTime: selectedGroup,
        }),
      );
      await Promise.all(promises);
      setIsAssigningUsers(false);
      setSelectedUsersToAssign([]);
      showNotification(
        "Usuários atribuídos com sucesso ao horário selecionado!",
        "success",
      );
    } catch (e) {
      showNotification("Erro ao atribuir usuários.", "error");
    }
  };

  const handleRemoveUserFromGroup = async (uid: string) => {
    if (isPreviousWeek) {
      showNotification("Semanas anteriores não podem ser editadas", "warning");
      return;
    }
    try {
      await scaleService.updateUserProfile(uid, { defaultLunchTime: null });
      showNotification("Usuário removido do grupo com sucesso!", "success");
    } catch (e) {
      showNotification("Erro ao remover usuário.", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-600" /> Colaboradores
          </h2>
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              {teams.map((team) => {
                const teamUsers = users.filter((u) => u.teamId === team.id);
                if (teamUsers.length === 0) return null;
                return (
                  <div
                    key={team.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="font-bold text-sm text-slate-700">
                        {team.name}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400">
                        {teamUsers.length}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {teamUsers.map((u) => (
                        <div
                          key={u.uid}
                          className="p-3 flex items-center justify-between hover:bg-white transition-colors"
                        >
                          <span className="text-sm font-medium text-slate-900 truncate pr-2 flex-[2]">
                            {u.name}
                          </span>
                          {u.defaultLunchTime ? (
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded flex-1 text-center truncate">
                              {u.defaultLunchTime}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold rounded flex-1 text-center">
                              SEM HORÁRIO
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200 gap-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock size={20} className="text-indigo-600" /> Grupos de Almoço
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePublishLunch}
              disabled={isPublishing}
              className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm rounded-xl transition-all disabled:opacity-50"
            >
              {isPublishing ? "Publicando..." : "Publicar Horários"}
            </button>
            <button
              onClick={() => setIsAddingTime(true)}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-sm rounded-xl transition-all"
            >
              + Novo Horário
            </button>
          </div>
        </div>

        {isAddingTime && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-200 animate-in zoom-in-95">
            <h3 className="font-bold text-slate-900 mb-2">
              Criar Novo Horário
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Hora de Início (O fim será calculado para 1h depois)
                </label>
                <input
                  type="time"
                  value={newTimeStart}
                  onChange={(e) => setNewTimeStart(e.target.value)}
                  className="mt-1 w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-bold text-slate-700"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsAddingTime(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-center"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddGroup}
                  className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-center"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lunchGroups.map((group) => {
            const groupUsers = users.filter(
              (u) => u.defaultLunchTime === group,
            );
            return (
              <div
                key={group}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-indigo-500" />
                    <span className="font-black text-slate-800 tracking-wide">
                      {group}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteGroup(group)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  {groupUsers.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                      Nenhum colaborador
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {groupUsers.map((u) => (
                        <div
                          key={u.uid}
                          className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg group/user"
                        >
                          <span className="text-sm font-medium text-slate-700 truncate pr-2">
                            {u.name}
                          </span>
                          <button
                            onClick={() => handleRemoveUserFromGroup(u.uid)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover/user:opacity-100 transition-all font-bold"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setIsAssigningUsers(true);
                    }}
                    className="w-full py-2.5 border-2 border-indigo-100 text-indigo-600 font-bold text-sm bg-white hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    + Adicionar Pessoas
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={isAssigningUsers}
        onClose={() => {
          setIsAssigningUsers(false);
          setSelectedUsersToAssign([]);
        }}
        title={`Adicionar Pessoas: ${selectedGroup}`}
      >
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6 font-medium">
            Selecione os colaboradores. Apenas aqueles sem horário de almoço
            definido aparecem aqui.
          </p>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Pesquisar por nome..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-4 pr-2">
            {teams.map((team) => {
              const teamUsers = users.filter(
                (u) =>
                  u.teamId === team.id &&
                  !u.defaultLunchTime &&
                  u.name.toLowerCase().includes(userSearch.toLowerCase()),
              );
              if (teamUsers.length === 0) return null;
              return (
                <div key={team.id} className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase bg-white sticky top-0 py-1">
                    {team.name}
                  </h4>
                  {teamUsers.map((u) => {
                    const isSelected = selectedUsersToAssign.includes(u.uid);
                    return (
                      <label
                        key={u.uid}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedUsersToAssign((prev) => [
                                ...prev,
                                u.uid,
                              ]);
                            else
                              setSelectedUsersToAssign((prev) =>
                                prev.filter((id) => id !== u.uid),
                              );
                          }}
                        />
                        <p
                          className={`text-sm font-medium ${isSelected ? "text-indigo-900" : "text-slate-700"}`}
                        >
                          {u.name}
                        </p>
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setIsAssigningUsers(false);
                setSelectedUsersToAssign([]);
                setUserSearch("");
              }}
              className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleAssignUsers}
              disabled={selectedUsersToAssign.length === 0}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
            >
              Salvar ({selectedUsersToAssign.length} usuários)
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
