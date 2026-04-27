'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AdminMobileNav() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';

  const navItems = [
    { name: 'Home', icon: LayoutDashboard, href: '/admin' },
    { name: 'Equipes', icon: Users, href: '/admin?tab=equipes' },
    { name: 'Usuários', icon: Shield, href: '/admin?tab=usuarios' },
    { name: 'Relatórios', icon: BarChart3, href: '/admin?tab=relatorios' },
    { name: 'Perfil', icon: UserPlus, href: '/admin?tab=perfil' },
    { name: 'Ajustes', icon: Settings, href: '/admin?tab=configuracoes' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around z-50">
      {navItems.map((item) => {
        const itemTab = item.href === '/admin' ? 'dashboard' : item.href.split('=')[1];
        const isActive = currentTab === itemTab;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              isActive 
                ? 'text-blue-600' 
                : 'text-slate-500'
            }`}
          >
            <item.icon size={20} className={isActive ? 'fill-blue-600/10' : ''} />
            <span className="text-[10px] font-bold">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
