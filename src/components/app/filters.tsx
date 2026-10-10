'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PageMeta } from '@/lib/api/client';
import { CATEGORIES, LANGUAGES, VERDICT_LABELS, VERDICTS } from '@/lib/constants';

const ALL = '__all__';

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
      <SelectTrigger className={className ?? 'w-44'} aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: all</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({ value: l.code, label: l.name }));
export const CATEGORY_OPTIONS = Object.entries(CATEGORIES).map(([value, label]) => ({ value, label }));
export const VERDICT_OPTIONS = VERDICTS.map((v) => ({ value: v, label: VERDICT_LABELS[v] }));
export const REVIEW_OPTIONS = [
  { value: 'PENDING_REVIEW', label: 'Pending review' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function Pagination({ meta, onPage }: { meta: PageMeta | undefined; onPage: (page: number) => void }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between gap-2 text-sm text-muted-foreground" aria-label="Pagination">
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.total} items
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          <ChevronLeft /> Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>
          Next <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
