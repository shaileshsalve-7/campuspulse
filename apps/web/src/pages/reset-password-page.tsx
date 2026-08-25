import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from '../api/auth';
import { ApiClientError } from '../api/client';
import { Button, buttonStyles } from '../components/button';
import { FieldError, Input } from '../components/form-field';

const schema = z.object({ password: z.string().min(12, 'Use at least 12 characters.').regex(/[a-z]/, 'Include a lowercase letter.').regex(/[A-Z]/, 'Include an uppercase letter.').regex(/\d/, 'Include a number.') });
type InputData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams(); const token = searchParams.get('token'); const [message, setMessage] = useState<string>(); const [errorMessage, setErrorMessage] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InputData>({ resolver: zodResolver(schema) });
  const submit = async ({ password }: InputData) => { if (!token) { setErrorMessage('This reset link is incomplete.'); return; } try { const response = await authApi.resetPassword(token, password); setMessage(response.message); } catch (error) { setErrorMessage(error instanceof ApiClientError ? error.message : 'Unable to reset the password.'); } };
  if (message) return <div className="w-full text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 size={28} /></span><h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Password updated.</h2><p className="mt-3 text-sm text-slate-500">{message}</p><Link to="/login" className={buttonStyles('primary', 'mt-7 w-full')}>Sign in</Link></div>;
  return <div className="w-full"><div className="mb-8"><p className="text-sm font-semibold text-brand-600">NEW PASSWORD</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Choose a strong password.</h2></div><form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">New password<Input className="mt-2" type="password" autoComplete="new-password" placeholder="12+ characters, upper/lowercase + number" {...register('password')} /></label><FieldError>{errors.password?.message}</FieldError>{errorMessage && <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{errorMessage}</p>}<Button className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Updating…' : 'Update password'}</Button></form></div>;
}
