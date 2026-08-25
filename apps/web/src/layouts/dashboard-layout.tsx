import { Bell, ChartNoAxesCombined, ChevronDown, Compass, Home, LogOut, Map, Menu, Moon, Newspaper, RadioTower, Search, Sun, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brand } from '../components/brand';
import { Button } from '../components/button';
import { useAuth } from '../context/auth-context';
import { cn, initials } from '../lib/utils';

const navigation = [
  { label: 'Overview', icon: Home, href: '/dashboard' },
  { label: 'Reports', icon: RadioTower, href: '/issues' },
  { label: 'Explore', icon: Compass, href: '/discover' },
  { label: 'Campus map', icon: Map, href: '/map' },
  { label: 'Feedback', icon: Newspaper, href: '/feedback' },
  { label: 'Search', icon: Search, href: '/search' },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('campuspulse-theme') === 'dark');

  useEffect(() => { document.documentElement.classList.toggle('dark', isDark); localStorage.setItem('campuspulse-theme', isDark ? 'dark' : 'light'); }, [isDark]);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const signOut = async () => { await logout(); navigate('/'); };
  const sidebar = <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-950"><div className="px-2"><Brand /></div><nav className="mt-10 space-y-1" aria-label="Workspace"><p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[.15em] text-slate-400">Workspace</p>{navigation.map(({ label, icon: Icon, href }) => <Link key={label} to={href} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition', location.pathname === href ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100')}><Icon size={18} />{label}</Link>)}{(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && <Link to="/admin" className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition', location.pathname === '/admin' ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900')}><ChartNoAxesCombined size={18} />Analytics</Link>}</nav><div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-400">CampusPulse</p><p className="mt-2 text-sm font-semibold text-slate-800 dark:text-white">Your secure workspace is ready.</p><p className="mt-1 text-xs leading-5 text-slate-500">Reports, events, communities, and campus updates in one place.</p></div></aside>;

  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"><div className="hidden min-h-screen lg:fixed lg:inset-y-0 lg:left-0 lg:block">{sidebar}</div>{open && <div className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" onClick={() => setOpen(false)} />}{open && <div className="fixed inset-y-0 left-0 z-50 lg:hidden">{sidebar}</div>}<div className="min-h-screen lg:pl-72"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-7"><div className="flex items-center gap-3"><button className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 lg:hidden" type="button" onClick={() => setOpen((current) => !current)} aria-label="Toggle navigation">{open ? <X size={20} /> : <Menu size={20} />}</button><div><p className="text-sm font-semibold text-slate-900 dark:text-white">Good to see you, {user?.firstName}.</p><p className="hidden text-xs text-slate-500 sm:block">Here’s your campus at a glance.</p></div></div><div className="flex items-center gap-1 sm:gap-2"><button className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900" type="button" onClick={() => setIsDark((current) => !current)} aria-label="Toggle color theme">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button><Link to="/notifications" className="relative grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900" aria-label="Notifications"><Bell size={18} /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand-600" /></Link><div className="ml-1 flex items-center gap-2 rounded-lg p-1 sm:ml-2"><span className="grid size-8 place-items-center rounded-lg bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200">{user ? initials(user.firstName, user.lastName) : '?'}</span><button className="hidden items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:flex" type="button" aria-label="Account menu">{user?.firstName}<ChevronDown size={15} /></button></div></div></header><main className="mx-auto max-w-7xl px-4 py-7 pb-24 sm:px-7 sm:py-9 lg:pb-9">{children}</main></div><nav className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-4 border-t border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"><Link to="/dashboard" className="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-brand-600"><Home size={18} />Overview</Link><Link to="/issues" className="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-500"><RadioTower size={18} />Reports</Link><Link to="/discover" className="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-500"><Compass size={18} />Explore</Link><button type="button" onClick={signOut} className="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-500"><LogOut size={18} />Sign out</button></nav></div>;
}
