'use client';

import React from 'react';
import { Home, Calendar, User, Bell, MapPin } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'home' | 'escala' | 'avisos' | 'perfil';
  setActiveTab: (tab: 'home' | 'escala' | 'avisos' | 'perfil') => void;
  unreadCount?: number;
}

export default function MobileNav({ activeTab, setActiveTab, unreadCount = 0 }: MobileNavProps) {
  const navItems = [
    { id: 'home', name: 'Início', icon: Home },
    { id: 'escala', name: 'Escala', icon: Calendar },
    { id: 'avisos', name: 'Avisos', icon: Bell, badge: unreadCount > 0 },
    { id: 'perfil', name: 'Perfil', icon: User },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 sm:left-1/2 sm:-translate-x-1/2 w-full sm:max-w-md border-t border-slate-200 bg-white px-4 pb-6 pt-3 flex items-center z-20 justify-around transition-colors">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.name}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all p-2 rounded-xl relative ${
              isActive 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="relative">
              <item.icon size={24} />
              {'badge' in item && item.badge && !isActive && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </div>
            <p className="text-[10px] font-bold">{item.name}</p>
          </button>
        );
      })}
    </div>
  );
}
