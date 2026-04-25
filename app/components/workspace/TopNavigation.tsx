type TopNavigationProps = {
  persistenceStatus: 'local-only' | 'loading' | 'ready' | 'saving' | 'saved' | 'error';
  persistenceError?: string | null;
};

function getStatusLabel(status: TopNavigationProps['persistenceStatus']) {
  if (status === 'local-only') {
    return 'Local only';
  }

  if (status === 'loading') {
    return 'Loading';
  }

  if (status === 'saving') {
    return 'Saving';
  }

  if (status === 'saved') {
    return 'Saved';
  }

  if (status === 'error') {
    return 'Sync error';
  }

  return 'Ready';
}

export function TopNavigation({
  persistenceStatus,
  persistenceError,
}: TopNavigationProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-center px-4 pt-4">
      <div className="pointer-events-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-white/70 bg-white/88 px-4 py-3 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
            <span className="text-sm font-semibold text-slate-700">SC</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Social Content Lab
            </p>
            <p className="text-xs text-slate-500">
              Build the board now, persist it with Supabase
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            title={persistenceError ?? getStatusLabel(persistenceStatus)}
            className={[
              'rounded-full border px-3 py-2 text-xs font-medium',
              persistenceStatus === 'error'
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-slate-200 bg-slate-50 text-slate-600',
            ].join(' ')}
          >
            {getStatusLabel(persistenceStatus)}
          </span>

          <nav className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/80 p-1">
            <span className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold tracking-[0.16em] text-white">
              1. BRAINSTORMING
            </span>
            <span className="rounded-full px-3 py-2 text-xs font-medium tracking-[0.16em] text-slate-400">
              2. CHOICE
            </span>
            <span className="rounded-full px-3 py-2 text-xs font-medium tracking-[0.16em] text-slate-400">
              3. GENERATING
            </span>
          </nav>
        </div>
      </div>
    </header>
  );
}
