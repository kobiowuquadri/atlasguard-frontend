'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/form-controls';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/overlays';
import { errorMessage } from '@/lib/api/client';
import { useArchiveProject, useCreateProject, useUpdateProject } from '@/lib/api/hooks';

const schema = z.object({
  name: z.string().trim().min(2, 'Use at least 2 characters').max(100, 'Use at most 100 characters'),
  description: z.string().trim().max(1000, 'Use at most 1,000 characters'),
});
type Values = z.infer<typeof schema>;

function ProjectForm({
  defaultValues,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  defaultValues: Values;
  submitLabel: string;
  pending: boolean;
  error: unknown;
  onSubmit: (values: Values) => void;
  onCancel: () => void;
}) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues });
  const { errors } = form.formState;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {error ? (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-red-200">
          {errorMessage(error)}
        </p>
      ) : null}
      <Field label="Project name" htmlFor="project-name" error={errors.name?.message}>
        <Input id="project-name" placeholder="e.g. Agro-advisory chatbot" aria-invalid={!!errors.name} {...form.register('name')} />
      </Field>
      <Field label="Description" htmlFor="project-description" error={errors.description?.message} hint="Optional. What does this application do?">
        <Textarea id="project-description" rows={3} aria-invalid={!!errors.description} {...form.register('description')} />
      </Field>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateProject();
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>A project represents an AI application you want to evaluate with N-ATLaS.</DialogDescription>
        </DialogHeader>
        <ProjectForm
          defaultValues={{ name: '', description: '' }}
          submitLabel="Create project"
          pending={create.isPending}
          error={create.error}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) =>
            create.mutate(
              { name: values.name, description: values.description || undefined },
              {
                onSuccess: (project) => {
                  toast.success(`Project “${project.name}” created`);
                  onOpenChange(false);
                  router.push(`/projects/${project.id}`);
                },
              },
            )
          }
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: { id: string; name: string; description: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateProject(project.id);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
        </DialogHeader>
        <ProjectForm
          defaultValues={{ name: project.name, description: project.description ?? '' }}
          submitLabel="Save changes"
          pending={update.isPending}
          error={update.error}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) =>
            update.mutate(values, {
              onSuccess: () => {
                toast.success('Project updated');
                onOpenChange(false);
              },
            })
          }
        />
      </DialogContent>
    </Dialog>
  );
}

export function ArchiveProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const archive = useArchiveProject();
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive “{project.name}”?</DialogTitle>
          <DialogDescription>
            The project disappears from your lists and its project-scoped API keys are revoked. Evaluation history is kept so
            past reports stay reproducible.
          </DialogDescription>
        </DialogHeader>
        {archive.error ? <p className="text-sm text-red-300">{errorMessage(archive.error)}</p> : null}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={archive.isPending}
            onClick={() =>
              archive.mutate(project.id, {
                onSuccess: () => {
                  toast.success('Project archived');
                  router.push('/projects');
                },
              })
            }
          >
            Archive project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
