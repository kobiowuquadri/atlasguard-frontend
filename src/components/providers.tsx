'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/overlays';
import { API_PREFIX, ApiError } from '@/lib/api/client';

const PUBLIC_PATHS = ['/', '/login', '/signup'];
let redirecting = false;

/** A stale or revoked session: clear the HTTP-only cookie server-side, then go to login. */
async function handleUnauthenticated() {
  if (redirecting || PUBLIC_PATHS.includes(window.location.pathname)) return;
  redirecting = true;
  try {
    await fetch(`${API_PREFIX}/auth/logout`, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: '{}' });
  } finally {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
  }
}

function onError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) void handleUnauthenticated();
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError }),
        mutationCache: new MutationCache({ onError }),
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status > 0 && error.status < 500) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{ className: 'border border-border-strong bg-elevated text-foreground' }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
