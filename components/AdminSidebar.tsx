'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Plus, 
  Shield,
  UserPlus,
  Mail,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isCollapsed, onToggle, isMobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTab = searchParams.get('tab') || 'dashboard';

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Equipes', icon: Users, href: '/admin?tab=equipes' },
    { name: 'Postos e Vagas', icon: MapPin, href: '/admin?tab=postos' },
    { name: 'Usuários', icon: Shield, href: '/admin?tab=usuarios' },
    { name: 'Avisos', icon: Mail, href: '/admin?tab=avisos' },
    { name: 'Perfil', icon: UserPlus, href: '/admin?tab=perfil' },
    { name: 'Configurações', icon: Settings, href: '/admin?tab=configuracoes' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} 
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        bg-white border-r border-slate-200 flex flex-col h-screen fixed lg:sticky top-0 transition-all duration-300 z-50 lg:z-10
      `}>
        <button 
          onClick={onToggle}
          className="hidden lg:flex absolute -right-3 top-8 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors z-10"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={`p-6 flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-3'}`}>
          <div className="rounded-xl p-2 shrink-0 size-12 flex items-center justify-center">
            <Image
              src="https://gaocipthqhvsmcomfgcr.supabase.co/storage/v1/object/public/eco/logo.png"
              alt="Logo"
              width={40}
              height={40}
              referrerPolicy="no-referrer"
            />
          </div>
          {(!isCollapsed || isMobileOpen) && <h1 className="text-2xl font-bold text-slate-900">ecooy</h1>}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const itemTab = item.href === '/admin' ? 'dashboard' : item.href.split('=')[1];
            const activeTab = mounted ? currentTab : 'dashboard';
            const isActive = activeTab === itemTab;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-3'} px-3 py-3 rounded-xl transition-all font-medium ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon size={20} className="shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span className="text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
        </div>
      </aside>
    </>
  );
}
