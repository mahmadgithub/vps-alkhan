import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toast } = useRestaurant();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl glass-panel border border-amber-500/40 text-amber-400 shadow-2xl shadow-amber-500/10 animate-bounce">
      <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
      <span className="text-xs font-semibold text-slate-100">{toast.message}</span>
    </div>
  );
}
