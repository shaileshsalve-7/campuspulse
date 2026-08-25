import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { Brand } from '../components/brand';

export function AuthLayout() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col">
        <Brand light />
        <div className="my-auto max-w-md">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[.18em] text-blue-300">A better campus, together</p>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight">Small reports. Visible change.</h1>
          <p className="mt-6 max-w-sm text-lg leading-8 text-slate-300">CampusPulse makes it simple to flag what matters, follow progress, and participate in campus life.</p>
          <div className="mt-10 space-y-4 text-sm text-slate-200">
            {['Instant account access', 'Private and secure sessions', 'Role-aware campus workspace'].map((item) => <div key={item} className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-300" />{item}</div>)}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400"><ShieldCheck size={17} /> Built for trusted campus communities</div>
      </section>
      <section className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between"><Brand /><Link className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600 dark:text-slate-400" to="/"><ArrowLeft size={16} /> Back to site</Link></div>
        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12"><Outlet /></div>
      </section>
    </main>
  );
}
