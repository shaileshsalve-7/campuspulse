import { RadioTower } from 'lucide-react';

export function LoadingScreen() {
  return <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950"><div className="flex items-center gap-3 text-slate-500"><span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white"><RadioTower size={20} /></span><span className="animate-pulse text-sm font-medium">Opening CampusPulse…</span></div></div>;
}
