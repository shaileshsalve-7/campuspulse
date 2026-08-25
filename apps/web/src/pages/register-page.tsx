import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Eye, EyeOff, MailCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from '../api/auth';
import { ApiClientError } from '../api/client';
import { Button, buttonStyles } from '../components/button';
import { FieldError, Input } from '../components/form-field';

const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.').max(50),
  lastName: z.string().trim().min(1, 'Last name is required.').max(50),
  email: z.string().email('Enter a valid college email.'),
  password: z.string().min(12, 'Use at least 12 characters.').regex(/[a-z]/, 'Include a lowercase letter.').regex(/[A-Z]/, 'Include an uppercase letter.').regex(/\d/, 'Include a number.'),
});
type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [verificationToken, setVerificationToken] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (input: RegisterInput) => {
    setFormError(undefined);
    try {
      const response = await authApi.register(input);
      setVerificationToken(response.data?.developmentToken);
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : 'Unable to create your account.');
    }
  };

  if (verificationToken !== undefined) {
    return <div className="w-full text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><MailCheck size={27} /></span><h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Check your inbox.</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">We’ve sent a verification link to your college email. Verify it before signing in.</p><Link className={buttonStyles('primary', 'mt-7 w-full')} to={`/verify-email?token=${verificationToken}`}><CheckCircle2 size={17} /> Verify this development account</Link><p className="mt-5 text-xs leading-5 text-slate-400">This direct verification option appears only while local email delivery is set to console mode.</p></div>;
  }

  return (
    <div className="w-full"><div className="mb-7"><p className="text-sm font-semibold text-brand-600">GET STARTED</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Join your campus pulse.</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Create a verified student account in a minute.</p></div><form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">First name<Input className="mt-2" autoComplete="given-name" {...register('firstName')} /></label><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Last name<Input className="mt-2" autoComplete="family-name" {...register('lastName')} /></label></div><div className="grid gap-1 sm:grid-cols-2"><FieldError>{errors.firstName?.message}</FieldError><FieldError>{errors.lastName?.message}</FieldError></div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">College email<Input className="mt-2" type="email" autoComplete="email" placeholder="you@college.edu" {...register('email')} /></label><FieldError>{errors.email?.message}</FieldError><div><label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="register-password">Password</label><div className="relative mt-2"><Input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="12+ characters, upper/lowercase + number" {...register('password')} /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><FieldError>{errors.password?.message}</FieldError></div>{formError && <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700" role="alert">{formError}</p>}<Button className="mt-2 w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</Button></form><p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">Already registered? <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/login">Sign in</Link></p></div>
  );
}
