import { Badge } from '@/components/ui/badge';
import type { ExpectedFact, Provenance } from '@/lib/api/types';
import { languageName } from '@/lib/constants';

function factDetail(fact: ExpectedFact, language?: string): string | null {
  if (fact.type === 'numeric' && typeof fact.value === 'number') {
    return `Expected value ${fact.value.toLocaleString('en-NG')}${fact.unit ? ` ${fact.unit}` : ''}`;
  }
  if (fact.type === 'entity' && Array.isArray(fact.accepted)) {
    const byLang = (fact.acceptedByLanguage as Record<string, string[]> | undefined)?.[language ?? ''] ?? [];
    return `Accepted: ${[...fact.accepted, ...byLang].join(', ')}`;
  }
  if (fact.type === 'concept') {
    const evidence = (fact.evidence as Record<string, string[]> | undefined)?.[language ?? ''];
    return evidence?.length ? `Evidence phrases (${languageName(language!)}): ${evidence.join(', ')}` : 'No evidence phrases for this language — checked by a reviewer';
  }
  return null;
}

export function FactList({ facts, language }: { facts: ExpectedFact[]; language?: string }) {
  if (facts.length === 0) return <p className="text-sm text-muted-foreground">No reference facts for this case.</p>;
  return (
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-inset">
      {facts.map((fact) => (
        <li key={fact.id} className="px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {fact.type}
            </Badge>
            {!fact.required && <Badge variant="outline">optional</Badge>}
            <span className="text-[13px]">{fact.description}</span>
          </div>
          {factDetail(fact, language) && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{factDetail(fact, language)}</p>}
        </li>
      ))}
    </ul>
  );
}

const TRANSLATION_LABEL: Record<string, string> = {
  original: 'Original',
  human_translation: 'Human translation',
  machine_translation: 'Machine translation',
  ai_generated: 'AI-generated translation',
};

export function ProvenanceList({ provenance }: { provenance: Provenance }) {
  const rows: Array<[string, string | undefined]> = [
    ['Source', provenance.sourceType],
    ['Translation', provenance.translationSource ? TRANSLATION_LABEL[provenance.translationSource] : undefined],
    ['Translated from', provenance.translatedFrom ? languageName(provenance.translatedFrom) : undefined],
    ['Author', provenance.author],
    ['Reference', provenance.sourceReference],
    ['Reviewed by', provenance.reviewedBy],
    ['Reviewed at', provenance.reviewedAt ? new Date(provenance.reviewedAt).toLocaleString('en-NG') : undefined],
    ['Notes', provenance.notes],
  ];
  return (
    <dl className="grid gap-x-4 gap-y-2 text-[13px] sm:grid-cols-[9rem_1fr]">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-foreground">{v}</dd>
          </div>
        ))}
    </dl>
  );
}
