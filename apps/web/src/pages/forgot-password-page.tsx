import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from '../api/auth';
import { ApiClientError } from '../api/client';
import { Button, buttonStyles } from '../components/button';
import { FieldError, Input } from '../components/form-field';

const schema = z.object({ email: z.string().email('Enter a valid email address.') });
type InputData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [message, setMessage] = useState<string>();
  const [token, setToken] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InputData>({ resolver: zodResolver(schema) });
  const submit = async ({ email }: InputData) => { try { const response = await authApi.forgotPassword(email); setMessage(response.message); setToken(response.data?.developmentToken); } catch (error) { setMessage(error instanceof ApiClientError ? error.message : 'Unable to request a reset.'); } };
  return <div className="w-full"><div className="mb-8"><p className="text-sm font-semibold text-brand-600">PASSWORD RECOVERY</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Reset your password.</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">We’ll email reset instructions if this account exists.</p></div>{message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800"><MailCheck className="mb-3" size={22} />{message}{token && <Link className={buttonStyles('primary', 'mt-4 w-full')} to={`/reset-password?token=${token}`}>Reset this development account</Link>}</div> : <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">College email<Input className="mt-2" type="email" autoComplete="email" placeholder="you@college.edu" {...register('email')} /></label><FieldError>{errors.email?.message}</FieldError><Button className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send reset link'}</Button></form>}<p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400"><Link className="font-semibold text-brand-600 hover:text-brand-700" to="/login">Back to sign in</Link></p></div>;
}
