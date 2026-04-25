'use client';

import { X } from 'lucide-react';

type WorkspaceActionPanelProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
};

export function WorkspaceActionPanel({
  title,
  description,
  children,
  onClose,
}: WorkspaceActionPanelProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-20 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-xl rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
