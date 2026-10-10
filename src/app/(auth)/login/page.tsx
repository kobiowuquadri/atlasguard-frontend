'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form-controls';
import { errorMessage } from '@/lib/api/client';
import { useLogin } from '@/lib/api/hooks';

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});
type Values = z.infer<typeof schema>;

/** Only same-site relative paths are allowed as post-login destinations. */
function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/overview';
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useLogin();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    login.mutate(values, { onSuccess: () => router.replace(safeNext(params.get('next'))) }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {login.error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-danger-soft px-3 py-2.5 text-sm text-red-200">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {errorMessage(login.error)}
        </p>
      )}
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" placeholder="you@company.ng" aria-invalid={!!errors.email} {...form.register('email')} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register('password')} />
      </Field>
      <Button type="submit" size="lg" loading={login.isPending} className="mt-1 w-full">
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Welcome back</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Sign in to evaluate N-ATLaS across Yoruba, Hausa, Igbo and Nigerian English.</p>
      <div className="mt-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        New to AtlasGuard?{' '}
        <Link href="/signup" className="font-medium text-violet-300 underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
