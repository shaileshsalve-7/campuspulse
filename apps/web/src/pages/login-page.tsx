import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError } from '../api/client';
import { Button } from '../components/button';
import { FieldError, Input } from '../components/form-field';
import { useAuth } from '../context/auth-context';

const loginSchema = z.object({ email: z.string().email('Enter a valid email address.'), password: z.string().min(1, 'Password is required.') });
type LoginInput = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const onSubmit = async (input: LoginInput) => {
    setFormError(undefined);
    try {
      await login(input.email, input.password);
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : 'Unable to sign you in right now.');
    }
  };

  return <div className="w-full"><div className="mb-8"><p className="text-sm font-semibold text-brand-600">WELCOME BACK</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Sign in to your campus.</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Enter your email and password to continue immediately.</p></div><form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Email<Input className="mt-2" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} /></label><FieldError>{errors.email?.message}</FieldError><div><div className="flex items-center justify-between"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="login-password">Password</label><Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Forgot password?</Link></div><div className="relative mt-2"><Input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" {...register('password')} /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><FieldError>{errors.password?.message}</FieldError></div>{formError && <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700" role="alert">{formError}</p>}<Button className="w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : <><LockKeyhole size={17} /> Sign in</>}</Button></form><p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">New to CampusPulse? <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/register">Create an account</Link></p></div>;
}
