'use client';

import React from 'react';
import { messaging, auth } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { onAuthStateChanged } from 'firebase/auth';
import { scaleService, Alert } from '@/lib/services/scaleService';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

const sessionStart = Date.now();

export default function NotificationManager() {
  const pathname = usePathname();
  const [toast, setToast] = React.useState<{ title: string, body: string } | null>(null);
  const [showNotificationPrompt, setShowNotificationPrompt] = React.useState(false);
  const lastAlertTimeRef = React.useRef<number>(sessionStart);
  
  const handleRequestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setShowNotificationPrompt(false);
      
      const user = auth.currentUser;
      if (user) {
        await scaleService.updateUserProfile(user.uid, {
          notificationPermission: permission
        });

        if (permission === 'granted') {
          await requestToken(user.uid);
        }
      }
    } catch (error) {
      console.error("Error setting up notifications:", error);
      setShowNotificationPrompt(false);
    }
  };

  const requestToken = React.useCallback(async (uid: string) => {
    try {
      if (!messaging) return;

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY // Recomended to keep FCM stable
      });

      if (token) {
        console.log('FCM Token:', token);
        
        // Fetch current profile to manage tokens array
        const profile = await scaleService.getUserProfile(uid);
        const currentTokens = profile?.fcmTokens || (profile?.fcmToken ? [profile.fcmToken] : []);
        
        const deviceName = () => {
          if (typeof window === 'undefined') return 'Unknown';
          const ua = window.navigator.userAgent;
          if (ua.includes('iPhone')) return 'iPhone';
          if (ua.includes('Android')) return 'Android';
          if (ua.includes('Windows')) return 'Windows PC';
          if (ua.includes('Macintosh')) return 'Mac';
          return 'Dispositivo Web';
        };

        const existingTokenIndex = currentTokens.findIndex(t => {
          if (typeof t === 'string') return t === token;
          return t.token === token;
        });

        const newDeviceToken = {
          token,
          deviceName: deviceName(),
          lastActive: Date.now()
        };

        if (existingTokenIndex === -1) {
          await scaleService.updateUserProfile(uid, {
            fcmToken: token, 
            fcmTokens: [...currentTokens, newDeviceToken]
          });
        } else {
          // Update the entry if it exists to refresh lastActive
          const updatedTokens = [...currentTokens];
          updatedTokens[existingTokenIndex] = newDeviceToken;
          await scaleService.updateUserProfile(uid, {
            fcmToken: token,
            fcmTokens: updatedTokens
          });
        }
      } else {
        console.log('No registration token available.');
      }
    } catch (err) {
      console.log('An error occurred while retrieving token. ', err);
    }
  }, []);

  // Real-time Firestore Alert Listener for In-App Toasts
  React.useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      // Listen for NEW alerts created after this component mounted
      const q = query(
        collection(getDb(), 'alerts'),
        where('createdAt', '>', lastAlertTimeRef.current),
        limit(1)
      );

      const unsubSnap = onSnapshot(q, async (snapshot) => {
        const profile = await scaleService.getUserProfile(user.uid);
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const alert = change.doc.data() as Alert;
            
            // Check if alert is relevant to this user
            const isRelevant = 
              alert.targetAudience === 'all' || 
              (alert.targetAudience === 'team' && alert.targetId === profile?.teamId) ||
              (alert.targetAudience === 'user' && alert.targetId === user.uid);

            if (isRelevant) {
              setToast({
                title: alert.title,
                body: alert.message
              });

              // Update last alert time to avoid showing same alert again
              lastAlertTimeRef.current = alert.createdAt;

              // Auto close
              setTimeout(() => {
                setToast(null);
              }, 8000);
            }
          }
        });
      });

      return () => unsubSnap();
    });

    return () => unsubAuth();
  }, [pathname]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    // Don't ask for permission on the login page
    if (pathname === '/login') return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (Notification.permission === 'default') {
          setShowNotificationPrompt(true);
        } else if (Notification.permission === 'granted') {
          await requestToken(user.uid);
        }
      }
    });

    return () => unsubscribe();
  }, [requestToken, pathname]);

  React.useEffect(() => {
    if (messaging) {
      const unsubscribeAuto = onMessage(messaging, (payload) => {
        console.log('FCM Foreground message received:', payload);
        
        // Use notification object if present, otherwise fallback to data
        const title = payload.notification?.title || payload.data?.title;
        const body = payload.notification?.body || payload.data?.body;

        if (title || body) {
          setToast({
            title: title || 'Novo Aviso',
            body: body || ''
          });

          // Update lastAlertTime to prevent Firestore listener from showing same alert
          lastAlertTimeRef.current = Date.now();

          // Auto close after 8 seconds
          setTimeout(() => {
            setToast(null);
          }, 8000);
        }
      });
      return () => unsubscribeAuto();
    }
  }, []);

  return (
    <AnimatePresence>
      {showNotificationPrompt && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full relative"
          >
             <button 
                onClick={() => setShowNotificationPrompt(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
             >
                <X size={20} />
             </button>
             <h3 className="text-xl font-black text-slate-900 mb-2">Notificações</h3>
             <p className="text-sm text-slate-600 mb-6">Deseja receber avisos sobre sua escala diretamente na tela do seu celular?</p>
             <button
               onClick={handleRequestPermission}
               className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
             >
               Permitir Notificações
             </button>
          </motion.div>
        </motion.div>
      )}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed top-4 left-4 right-4 z-[9999] sm:left-auto sm:right-4 sm:w-80"
        >
          <div className="bg-white rounded-full shadow-xl border border-blue-100 p-2 pl-3 flex gap-3 items-center relative overflow-hidden group max-w-sm ml-auto">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
            
            <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 relative">
              <Bell size={16} />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {toast.title}
              </h4>
              <p className="text-[10px] text-slate-600 truncate">
                {toast.body}
              </p>
            </div>

            <button 
              onClick={() => setToast(null)}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors mr-1"
            >
              <X size={14} />
            </button>

            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 8, ease: "linear" }}
              className="absolute bottom-0 left-0 h-0.5 bg-blue-600/20"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
