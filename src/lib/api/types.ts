import type { Verdict } from '@/lib/constants';

export type Role = 'DEVELOPER' | 'ADMIN';
export type RunStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type CheckStatus = 'pass' | 'fail' | 'uncertain' | 'not_applicable';
export type FactStatus = 'supported' | 'contradicted' | 'not_found' | 'uncertain';
export type ConsistencyVerdict = 'CONSISTENT' | 'INCONSISTENT' | 'NEEDS_REVIEW' | 'INSUFFICIENT_DATA';
export type ContentReviewStatus = 'DRAFT' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  onboardedAt: string | null;
  createdAt: string;
}

export interface MeResponse {
  user: User;
  authMethod: 'session' | 'api_key';
  apiKeyProjectId: string | null;
}

export interface ResultBucket {
  total: number;
  passed: number;
  failed: number;
  needsReview: number;
  skipped: number;
  errors: number;
  pending: number;
  determinate: number;
  verifiedPassRate: number | null;
  averageLatencyMs: number | null;
  medianLatencyMs: number | null;
}

export interface RunSummary {
  overall: ResultBucket;
  byLanguage: Record<string, ResultBucket>;
  byCategory: Record<string, ResultBucket>;
  byLanguageCategory: Record<string, Record<string, ResultBucket>>;
  consistency: { groups: number; byVerdict: Partial<Record<ConsistencyVerdict, number>>; confirmedContradictions: number };
  humanReviewed: number;
  computedAt: string;
}

export interface RunPreview {
  id: string;
  status: RunStatus;
  isSimulated: boolean;
  totalCases: number;
  completedCases: number;
  summary: RunSummary | null;
  createdAt: string;
  completedAt: string | null;
  languages: string[];
  suite: { id: string; name: string; version: string };
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  runCount: number;
  latestRun: RunPreview | null;
}

export interface ProjectDetail extends Omit<Project, 'runCount' | 'latestRun'> {
  recentRuns: RunPreview[];
  evaluationSummary: {
    totalRuns: number;
    runsByStatus: Partial<Record<RunStatus, number>>;
    lastCompletedRun: RunPreview | null;
  };
}

export interface SuiteStats {
  caseCount: number;
  semanticGroupCount: number;
  languages: Record<string, number>;
  categories: Record<string, number>;
  reviewStatus: Partial<Record<ContentReviewStatus, number>>;
  verifiedCount: number;
  unreviewedCount: number;
}

export interface Suite {
  id: string;
  namespace: string;
  slug: string;
  name: string;
  description: string | null;
  version: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  isOfficial: boolean;
  ownerId: string | null;
  contentHash: string;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string } | null;
  stats: SuiteStats;
  canManage: boolean;
}

export interface ExpectedFact {
  id: string;
  type: 'numeric' | 'entity' | 'concept';
  description: string;
  required: boolean;
  value?: number;
  unit?: string;
  tolerance?: number;
  accepted?: string[];
  conflicting?: string[];
  evidence?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface SemanticGroupSummary {
  id: string;
  key: string;
  title: string;
  description: string | null;
  category: string;
  factCount: number;
  expectedFacts: ExpectedFact[];
  languages: string[];
  caseIds: string[];
}

export interface SuiteDetail extends Suite {
  semanticGroups: SemanticGroupSummary[];
}

export interface Provenance {
  sourceType: 'human' | 'official' | 'synthetic';
  sourceReference?: string;
  author?: string;
  translationSource?: 'original' | 'human_translation' | 'machine_translation' | 'ai_generated';
  translatedFrom?: string;
  reviewStatus: 'draft' | 'pending_review' | 'verified';
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface BenchmarkCase {
  id: string;
  suiteId: string;
  semanticGroupId: string | null;
  key: string;
  title: string;
  description: string | null;
  language: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  prompt: string;
  requiredTerms: string[];
  forbiddenTerms: string[];
  evaluationRules: Array<{ type: string; [key: string]: unknown }>;
  provenance: Provenance;
  reviewStatus: ContentReviewStatus;
  reviewedAt: string | null;
  reviewNotes: string | null;
  reviewedBy: { id: string; name: string } | null;
  tags: string[];
  revision: number;
  semanticGroup: { id: string; key: string; title: string } | null;
  facts: ExpectedFact[];
}

export interface InferenceDefaults {
  temperature: number;
  maxTokens: number;
  topP?: number;
  repetitionPenalty?: number;
  systemPrompt: string | null;
}

export interface ModelConfig {
  id: string;
  key: string | null;
  name: string;
  providerType: 'NATLAS' | 'FIXTURE';
  modelIdentifier: string;
  modelRevision: string | null;
  supportedLanguages: string[];
  defaultParameters: InferenceDefaults;
  isSimulated: boolean;
  availability: 'available' | 'unavailable' | 'not_configured';
  availabilityMessage: string | null;
}

export interface ProviderHealth {
  status: 'available' | 'unavailable' | 'not_configured';
  checkedAt: string;
  latencyMs: number | null;
  message: string;
  simulated: boolean;
  details?: Record<string, unknown>;
}

export interface ModelInfo {
  providerType: 'NATLAS' | 'FIXTURE';
  providerName: string;
  modelIdentifier: string;
  servedModel?: string | null;
  revision?: string | null;
  dtype?: string | null;
  quantization?: string | null;
  device?: string | null;
  runtime?: string | null;
  contextLength?: number | null;
  simulated: boolean;
  reportedBy: 'provider' | 'configuration';
}

export interface ModelStatus {
  natlas: { configured: boolean; health: ProviderHealth; model: ModelInfo };
  fixtures: { enabled: boolean; health?: ProviderHealth; simulated?: boolean };
  attribution: string;
}

export interface InferenceConfig {
  temperature: number;
  maxTokens: number;
  topP: number | null;
  repetitionPenalty: number | null;
  seed: number | null;
  systemPrompt: string | null;
}

export interface Run {
  id: string;
  projectId: string;
  benchmarkSuiteId: string;
  benchmarkVersion: string;
  benchmarkContentHash: string;
  modelConfigurationId: string;
  providerType: 'NATLAS' | 'FIXTURE';
  modelIdentifier: string;
  modelRevision: string | null;
  isSimulated: boolean;
  inferenceConfig: InferenceConfig;
  evaluatorVersion: string;
  languages: string[];
  selection: { categories: string[] | null; caseIds: string[] | null; onlyVerified: boolean };
  status: RunStatus;
  totalCases: number;
  completedCases: number;
  failedCases: number;
  summary: RunSummary | null;
  providerMetadata: { modelInfo?: ModelInfo; health?: ProviderHealth; workerId?: string; recordedAt?: string } | null;
  errorDetails: { code: string; message: string } | null;
  cancelRequestedAt: string | null;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  project: { id: string; name: string };
  suite: { id: string; slug: string; name: string; version: string; isOfficial: boolean };
  modelConfiguration: { id: string; name: string; providerType: string; isSimulated: boolean };
  createdBy: { id: string; name: string };
}

export interface RunDetail extends Run {
  progress: { total: number; pending: number; running: number; done: number; byVerdict: Partial<Record<Verdict, number>> };
}

export interface CheckResult {
  id: string;
  dimension: 'response_validity' | 'language_compliance' | 'factual_accuracy' | 'instruction_compliance' | 'latency';
  status: CheckStatus;
  method: string;
  explanation: string;
  evidence?: string;
  requiresHumanReview: boolean;
  details?: Record<string, unknown>;
}

export interface FactCheckResult {
  factId: string;
  factType: 'numeric' | 'entity' | 'concept';
  required: boolean;
  status: FactStatus;
  method: string;
  evidence?: string;
  explanation?: string;
  assertedValues?: Array<string | number>;
  requiresHumanReview: boolean;
}

export interface LanguageDetection {
  detected: string;
  confidence: number;
  shares: Record<string, number>;
  method: string;
  evidence: string[];
  wordCount: number;
  codeSwitching: boolean;
}

export interface CaseSnapshot {
  caseKey: string;
  title: string;
  revision: number;
  language: string;
  category: string;
  difficulty: string;
  reviewStatus: ContentReviewStatus;
  semanticGroupKey: string | null;
  semanticGroupTitle: string | null;
  facts: ExpectedFact[];
  rules: Array<{ type: string; [key: string]: unknown }>;
  requiredTerms: string[];
  forbiddenTerms: string[];
  provenance: Provenance;
}

export interface EvaluationResult {
  id: string;
  evaluationRunId: string;
  semanticGroupId: string | null;
  caseKey: string;
  language: string;
  category: string;
  prompt: string;
  caseSnapshot: CaseSnapshot;
  executionStatus: 'PENDING' | 'RUNNING' | 'DONE';
  attempts: number;
  response: string | null;
  responseTimeMs: number | null;
  providerInferenceMs: number | null;
  requestId: string | null;
  providerRequestId: string | null;
  responseMetadata: {
    provider?: string;
    servedModel?: string;
    finishReason?: string | null;
    usage?: { promptTokens: number | null; completionTokens: number | null; totalTokens: number | null } | null;
    attempts?: number;
    simulated?: boolean;
  } | null;
  verdict: Verdict | null;
  finalVerdict: Verdict | null;
  checks: CheckResult[] | null;
  factChecks: FactCheckResult[] | null;
  languageDetection: LanguageDetection | null;
  summary: string | null;
  requiresReview: boolean;
  errorDetails: { code: string; message: string; retryable?: boolean; attempts?: number } | null;
  executedAt: string | null;
  _count?: { reviews: number };
}

export interface HumanReview {
  id: string;
  decision: 'PASSED' | 'FAILED';
  previousVerdict: Verdict | null;
  notes: string | null;
  reviewedAt: string;
  reviewer: { id: string; name: string };
}

export interface EvaluationResultDetail extends EvaluationResult {
  reviews: HumanReview[];
}

export interface ConsistencyFinding {
  type: string;
  severity: 'conflict' | 'omission' | 'review' | 'info';
  factId?: string;
  languages: string[];
  message: string;
  values?: Record<string, Array<string | number>>;
  statuses?: Record<string, FactStatus | 'no_response'>;
}

export interface ConsistencyGroup {
  id: string;
  semanticGroupId: string;
  semanticGroupKey: string;
  title: string;
  category: string;
  description: string | null;
  languagesCompared: string[];
  languagesMissing: string[];
  findings: ConsistencyFinding[];
  summary: { sharedFactsChecked: number; confirmedContradictions: number; missingFacts: number; uncertainFindings: number; consistentFacts: number };
  verdict: ConsistencyVerdict;
  method: string;
  expectedFacts: ExpectedFact[];
  entries: Array<{
    id: string;
    caseKey: string;
    language: string;
    languageName: string;
    prompt: string;
    response: string | null;
    verdict: Verdict | null;
    finalVerdict: Verdict | null;
    factChecks: FactCheckResult[] | null;
    errorDetails: { code: string; message: string } | null;
    responseTimeMs: number | null;
  }>;
}

export interface Overview {
  includeSimulated: boolean;
  simulatedRunCount: number;
  projectCount: number;
  totals: {
    runs: number;
    runsByStatus: Partial<Record<RunStatus, number>>;
    casesEvaluated: number;
    verifiedPassRate: number | null;
    determinate: number;
    averageLatencyMs: number | null;
    needsReview: number;
    errors: number;
  };
  verdictDistribution: Record<Verdict, number>;
  languageComparison: Array<ResultBucket & { language: string; name: string; evaluated: boolean }>;
  activity: Array<{ date: string; runs: number; completed: number }>;
  recentRuns: Array<Run>;
  model: { natlasConfigured: boolean; status: ProviderHealth['status']; message: string; fixturesEnabled: boolean };
}

export interface LanguageInsights {
  includeSimulated: boolean;
  languages: Array<{
    language: string;
    name: string;
    nativeName: string;
    evaluated: boolean;
    stats: ResultBucket | null;
    categories: Array<ResultBucket & { category: string; label: string }>;
    consistency: { groupsCompared: number; groupsWithConflicts: number };
  }>;
}

export interface ReportDocument {
  generatedAt: string;
  simulated: boolean;
  simulationNotice: string | null;
  overview: {
    project: { id: string; name: string };
    run: { id: string; status: RunStatus; createdAt: string; startedAt: string | null; completedAt: string | null; durationMs: number | null };
    benchmark: { id: string; slug: string; name: string; version: string; contentHash: string };
    model: { configurationName: string; providerType: string; modelIdentifier: string; modelRevision: string | null; isSimulated: boolean };
    inference: InferenceConfig;
    languages: string[];
  };
  summary: {
    total: number;
    completed: number;
    passed: number;
    failed: number;
    needsReview: number;
    skipped: number;
    errors: number;
    pending: number;
    verifiedPassRate: number | null;
    averageLatencyMs: number | null;
    medianLatencyMs: number | null;
    humanReviewed: number;
  };
  languagePerformance: Array<ResultBucket & { language: string; name: string }>;
  categoryPerformance: Array<ResultBucket & { category: string; label: string }>;
  consistency: { groupsCompared: number; byVerdict: Partial<Record<ConsistencyVerdict, number>>; confirmedContradictions: number };
  methodology: Record<string, string>;
  limitations: string[];
  attribution: string;
}

export interface CompareRow {
  key: string;
  label: string;
  base: ResultBucket | null;
  target: ResultBucket | null;
  passRateDelta: number | null;
  latencyDeltaMs: number | null;
}

export interface CompareResult {
  base: { id: string; createdAt: string; isSimulated: boolean; overall: ResultBucket };
  target: { id: string; createdAt: string; isSimulated: boolean; overall: ResultBucket };
  suite: { slug: string; name: string };
  warnings: string[];
  overall: { passRateDelta: number | null; latencyDeltaMs: number | null };
  byLanguage: CompareRow[];
  byCategory: CompareRow[];
  caseChanges: Array<{ caseKey: string; language: string; base: Verdict | null; target: Verdict | null; direction: 'improved' | 'regressed' | 'changed' }>;
  casesCompared: number;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  projectId: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  project: { id: string; name: string } | null;
}

export interface ImportResult {
  valid: boolean;
  saved: boolean;
  warnings: Array<{ path: string; message: string }>;
  counts: { semanticGroups: number; cases: number };
  suite?: { id: string; name: string };
  contentHash?: string;
}
