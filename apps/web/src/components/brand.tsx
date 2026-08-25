import { RadioTower } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', light ? 'text-white' : 'text-slate-950 dark:text-white')} aria-label="CampusPulse home">
      <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm"><RadioTower size={19} strokeWidth={2.4} /></span>
      <span>Campus<span className={light ? 'text-blue-200' : 'text-brand-600'}>Pulse</span></span>
    </Link>
  );
}
