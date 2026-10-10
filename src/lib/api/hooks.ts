'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  ApiKey,
  BenchmarkCase,
  CompareResult,
  ConsistencyGroup,
  EvaluationResult,
  EvaluationResultDetail,
  ImportResult,
  InferenceConfig,
  LanguageInsights,
  MeResponse,
  ModelConfig,
  ModelStatus,
  Overview,
  Project,
  ProjectDetail,
  ReportDocument,
  Run,
  RunDetail,
  RunStatus,
  Suite,
  SuiteDetail,
  User,
} from './types';

type Params = Record<string, string | number | boolean | undefined>;

export const ACTIVE_STATUSES: RunStatus[] = ['QUEUED', 'RUNNING'];
export const isActive = (status?: RunStatus) => !!status && ACTIVE_STATUSES.includes(status);

/* ----------------------------------------------------------------- auth */

export function useMe(enabled = true) {
  return useQuery({ queryKey: ['me'], queryFn: () => api.get<MeResponse>('/auth/me'), enabled, staleTime: 60_000, retry: false });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) => api.post<{ user: User }>('/auth/login', body),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; email: string; password: string }) => api.post<{ user: User }>('/auth/register', body),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ loggedOut: boolean }>('/auth/logout'),
    onSettled: () => qc.clear(),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) => api.patch<{ user: User }>('/users/me', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ user: User }>('/users/me/onboarding-complete'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

/* ------------------------------------------------------------- projects */

export function useProjects(params: Params = {}) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => api.page<Project>('/projects', { pageSize: 50, ...params }),
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({ queryKey: ['project', id], queryFn: () => api.get<ProjectDetail>(`/projects/${id}`), enabled: !!id });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string }) => api.post<Project>('/projects', body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] });
      void qc.invalidateQueries({ queryKey: ['overview'] });
    },
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; description?: string }) => api.patch<Project>(`/projects/${id}`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['project', id] });
      void qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useArchiveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

/* ----------------------------------------------------------- benchmarks */

export function useBenchmarks(params: Params = {}) {
  return useQuery({
    queryKey: ['benchmarks', params],
    queryFn: () => api.page<Suite>('/benchmarks', { pageSize: 50, ...params }),
    placeholderData: keepPreviousData,
  });
}

export function useBenchmark(id: string | undefined) {
  return useQuery({ queryKey: ['benchmark', id], queryFn: () => api.get<SuiteDetail>(`/benchmarks/${id}`), enabled: !!id });
}

export function useBenchmarkCases(id: string | undefined, params: Params) {
  return useQuery({
    queryKey: ['benchmark-cases', id, params],
    queryFn: () => api.page<BenchmarkCase>(`/benchmarks/${id}/cases`, params),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}

export function useImportBenchmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { dataset: unknown; dryRun?: boolean; official?: boolean }) => api.post<ImportResult>('/benchmarks/import', body),
    onSuccess: (data) => {
      if (data.saved) void qc.invalidateQueries({ queryKey: ['benchmarks'] });
    },
  });
}

export function useReviewCase(suiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { caseId: string; status: 'VERIFIED' | 'REJECTED' | 'PENDING_REVIEW'; notes?: string; attestation?: boolean }) => {
      const { caseId, ...rest } = body;
      return api.patch<BenchmarkCase>(`/benchmarks/${suiteId}/cases/${caseId}/review`, rest);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['benchmark-cases', suiteId] });
      void qc.invalidateQueries({ queryKey: ['benchmark', suiteId] });
      void qc.invalidateQueries({ queryKey: ['benchmarks'] });
    },
  });
}

/* ---------------------------------------------------------------- model */

export function useModelStatus() {
  return useQuery({
    queryKey: ['model-status'],
    queryFn: () => api.get<ModelStatus>('/model/status'),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useModelConfigs() {
  return useQuery({ queryKey: ['model-configs'], queryFn: () => api.get<ModelConfig[]>('/model-configurations') });
}

/* ---------------------------------------------------------- evaluations */

export function useRuns(params: Params = {}, options: { live?: boolean } = {}) {
  return useQuery({
    queryKey: ['runs', params],
    queryFn: () => api.page<Run>('/evaluations/runs', { pageSize: 20, ...params }),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => (options.live && query.state.data?.items.some((r) => isActive(r.status)) ? 3000 : false),
  });
}

export function useRun(id: string | undefined) {
  return useQuery({
    queryKey: ['run', id],
    queryFn: () => api.get<RunDetail>(`/evaluations/runs/${id}`),
    enabled: !!id,
    refetchInterval: (query) => (isActive(query.state.data?.status) ? 2000 : false),
  });
}

export function useRunResults(id: string | undefined, params: Params, live: boolean) {
  return useQuery({
    queryKey: ['run-results', id, params],
    queryFn: () => api.page<EvaluationResult>(`/evaluations/runs/${id}/results`, params),
    enabled: !!id,
    placeholderData: keepPreviousData,
    refetchInterval: live ? 3000 : false,
  });
}

export function useRunResult(runId: string | undefined, resultId: string | undefined) {
  return useQuery({
    queryKey: ['run-result', runId, resultId],
    queryFn: () => api.get<EvaluationResultDetail>(`/evaluations/runs/${runId}/results/${resultId}`),
    enabled: !!runId && !!resultId,
  });
}

export function useRunConsistency(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['run-consistency', id],
    queryFn: () => api.get<ConsistencyGroup[]>(`/evaluations/runs/${id}/consistency`),
    enabled: !!id && enabled,
  });
}

export interface CreateRunInput {
  projectId: string;
  suiteId: string;
  languages: string[];
  categories?: string[];
  caseIds?: string[];
  onlyVerified?: boolean;
  modelConfigurationId?: string;
  parameters?: Partial<Omit<InferenceConfig, 'seed' | 'topP' | 'repetitionPenalty' | 'systemPrompt'>> & {
    seed?: number;
    topP?: number;
    repetitionPenalty?: number;
    systemPrompt?: string;
  };
}

export function useCreateRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRunInput) => api.post<RunDetail>('/evaluations/runs', body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['runs'] });
      void qc.invalidateQueries({ queryKey: ['overview'] });
    },
  });
}

export function useCancelRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<RunDetail>(`/evaluations/runs/${id}/cancel`),
    onSuccess: (_d, id) => {
      void qc.invalidateQueries({ queryKey: ['run', id] });
      void qc.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}

export function useRerun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<RunDetail>(`/evaluations/runs/${id}/rerun`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['runs'] }),
  });
}

export function useReviewResult(runId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resultId: string; decision: 'PASSED' | 'FAILED'; notes?: string }) =>
      api.post<EvaluationResultDetail>(`/evaluations/runs/${runId}/results/${body.resultId}/reviews`, {
        decision: body.decision,
        notes: body.notes,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['run', runId] });
      void qc.invalidateQueries({ queryKey: ['run-results', runId] });
      void qc.invalidateQueries({ queryKey: ['run-result', runId] });
      void qc.invalidateQueries({ queryKey: ['report', runId] });
    },
  });
}

/* -------------------------------------------------------------- reports */

export function useReport(runId: string | undefined) {
  return useQuery({ queryKey: ['report', runId], queryFn: () => api.get<ReportDocument>(`/reports/${runId}`), enabled: !!runId });
}

export function useCompare(baseRunId: string | undefined, targetRunId: string | undefined) {
  return useQuery({
    queryKey: ['compare', baseRunId, targetRunId],
    queryFn: () => api.get<CompareResult>('/reports/compare', { baseRunId, targetRunId }),
    enabled: !!baseRunId && !!targetRunId && baseRunId !== targetRunId,
    retry: false,
  });
}

/* ------------------------------------------------------------- insights */

export function useOverview(includeSimulated: boolean) {
  return useQuery({
    queryKey: ['overview', { includeSimulated }],
    queryFn: () => api.get<Overview>('/insights/overview', { includeSimulated }),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });
}

export function useLanguageInsights(params: { projectId?: string; runId?: string; includeSimulated: boolean }) {
  return useQuery({
    queryKey: ['languages', params],
    queryFn: () => api.get<LanguageInsights>('/insights/languages', params),
    placeholderData: keepPreviousData,
  });
}

/* ------------------------------------------------------------- api keys */

export function useApiKeys() {
  return useQuery({ queryKey: ['api-keys'], queryFn: () => api.get<ApiKey[]>('/api-keys') });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; projectId?: string }) => api.post<{ apiKey: ApiKey; key: string }>('/api-keys', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/api-keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

/* ------------------------------------------------------------- feedback */

export interface FeedbackInput {
  testerIdentifier: string;
  developerBackground?: string;
  testedFeatures: string[];
  easeOfUseRating?: number;
  mostUsefulFeature?: string;
  problemsEncountered?: string;
  suggestions?: string;
  overallAssessment: string;
  consentRecorded: boolean;
}

export function useSubmitFeedback() {
  return useMutation({ mutationFn: (body: FeedbackInput) => api.post<{ id: string }>('/feedback', body) });
}
