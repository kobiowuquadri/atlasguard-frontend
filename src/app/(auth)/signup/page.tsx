'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form-controls';
import { errorMessage } from '@/lib/api/client';
import { useRegister } from '@/lib/api/hooks';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name (at least 2 characters)').max(100),
    email: z.email('Enter a valid email address'),
    password: z.string().min(8, 'Use at least 8 characters').max(128),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });
type Values = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const register = useRegister();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '', confirm: '' } });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(({ name, email, password }) =>
    register.mutate({ name, email, password }, { onSuccess: () => router.replace('/overview') }),
  );

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Create your account</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Free for developers building on N-ATLaS. Your first evaluation takes minutes.</p>
      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
        {register.error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-danger-soft px-3 py-2.5 text-sm text-red-200">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {errorMessage(register.error)}
          </p>
        )}
        <Field label="Name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...form.register('name')} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.ng" aria-invalid={!!errors.email} {...form.register('email')} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
          <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters.">
            <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register('password')} />
          </Field>
          <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
            <Input id="confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} {...form.register('confirm')} />
          </Field>
        </div>
        <Button type="submit" size="lg" loading={register.isPending} className="mt-1 w-full">
          Create account
        </Button>
      </form>
      <p className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-violet-300 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
