import { CheckCircle2, LoaderCircle, MailWarning } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import { buttonStyles } from '../components/button';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? 'Confirming your college email…' : 'This verification link is incomplete.');
  useEffect(() => {
    if (!token) return;
    authApi.verifyEmail(token).then((response) => { setState('success'); setMessage(response.message); }).catch((error: Error) => { setState('error'); setMessage(error.message); });
  }, [token]);
  const Icon = state === 'success' ? CheckCircle2 : state === 'loading' ? LoaderCircle : MailWarning;
  return <div className="w-full text-center"><span className={`mx-auto grid size-14 place-items-center rounded-2xl ${state === 'success' ? 'bg-emerald-100 text-emerald-700' : state === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-brand-600'}`}><Icon size={28} className={state === 'loading' ? 'animate-spin' : ''} /></span><h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{state === 'success' ? 'You’re verified.' : state === 'loading' ? 'Verifying your email' : 'Verification unavailable'}</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{message}</p>{state !== 'loading' && <Link to="/login" className={buttonStyles('primary', 'mt-7 w-full')}>{state === 'success' ? 'Continue to sign in' : 'Return to sign in'}</Link>}</div>;
}
