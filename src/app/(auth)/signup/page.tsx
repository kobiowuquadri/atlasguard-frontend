'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create your AtlasGuard account</CardTitle>
        <CardDescription>Free for developers building on N-ATLaS.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {register.error && (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-red-200">
              {errorMessage(register.error)}
            </p>
          )}
          <Field label="Name" htmlFor="name" error={errors.name?.message}>
            <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...form.register('name')} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register('email')} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters.">
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...form.register('password')}
            />
          </Field>
          <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
            <Input id="confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} {...form.register('confirm')} />
          </Field>
          <Button type="submit" loading={register.isPending} className="mt-1 w-full">
            Create account
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-300 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
