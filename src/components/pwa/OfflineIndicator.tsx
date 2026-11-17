import React from 'react';
import { useOnlineStatus } from '@/src/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex items-center gap-3 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white shadow-2xl animate-in slide-in-from-bottom-10">
      <div className="bg-white/20 p-1.5 rounded-lg">
        <WifiOff className="w-5 h-5 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="leading-tight">Offline Mode</span>
        <span className="text-[10px] font-medium opacity-90">Using cached data</span>
      </div>
      <div className="ml-2 w-2 h-2 rounded-full bg-white animate-pulse" />
    </div>
  );
};
