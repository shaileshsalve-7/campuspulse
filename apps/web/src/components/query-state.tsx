import type { ReactNode } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

export function InlineError({ message }: { message?: string }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"><span className="flex items-center gap-2"><AlertCircle size={17} />{message ?? 'We could not load this information.'}</span></div>;
}
export function EmptyState({ title, body, icon }: { title: string; body: string; icon?: ReactNode }) {
  return <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900"><div><span className="mx-auto grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">{icon ?? <Inbox size={20} />}</span><p className="mt-4 text-sm font-semibold text-slate-800 dark:text-white">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{body}</p></div></div>;
}
