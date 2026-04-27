'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Search, Bell, LogOut, Menu } from 'lucide-react';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/services/scaleService';

export default function AdminHeader({ user, onMenuClick, hasUnread = false }: { user?: UserProfile, onMenuClick?: () => void, hasUnread?: boolean }) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 px-6 py-4">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative transition-colors">
          <Bell size={20} />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
          )}
        </button>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          title="Sair"
        >
          <LogOut size={20} />
        </button>
        <div className="flex items-center gap-3 sm:pl-4 sm:border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900">Olá, {user?.name?.split(' ')[0] || 'Admin'}</p>
            <p className="text-xs text-slate-500">Administrador</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden border border-blue-100">
            <Image 
              src="https://picsum.photos/seed/admin/100/100" 
              alt="Admin Avatar" 
              width={40} 
              height={40}
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
