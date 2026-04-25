'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { ImageIcon, Sparkles, Video, Plus, Paperclip, Globe, Library, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
} from 'reactflow';

import { useCanvasBoard } from '../../hooks/useCanvasBoard';
import { useChoiceConfig } from '../../hooks/useChoiceConfig';
import { FloatingToolbar } from './FloatingToolbar';
import { TopNavigation } from './TopNavigation';
import { WorkspaceActionPanel } from './WorkspaceActionPanel';
import { TemplateGallery } from './TemplateGallery';
import { ChoiceScreen } from './ChoiceScreen';
import { CanvasCardNode } from './nodes/CanvasCardNode';
import { contentTemplates } from '../../lib/templates/catalog';
import type { WorkspaceContextPack } from '../../lib/context/workspace-context';

type ActivePanel = 'upload' | 'generate' | 'scrape' | 'template' | null;

function trimLabel(label: string, maxLength = 42) {
  if (label.length <= maxLength) {
    return label;
  }

  const extensionIndex = label.lastIndexOf('.');

  if (extensionIndex <= 0 || extensionIndex === label.length - 1) {
    return `${label.slice(0, maxLength - 1)}…`;
  }

  const extension = label.slice(extensionIndex);
  const base = label.slice(0, extensionIndex);
  const visibleBaseLength = Math.max(12, maxLength - extension.length - 1);

  return `${base.slice(0, visibleBaseLength)}…${extension}`;
}

export function WorkspaceCanvas() {
  const {
    nodes,
    onNodesChange,
    actions,
    persistenceStatus,
    persistenceError,
    isCanvasReady,
  } =
    useCanvasBoard();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [isRefreshingContext, setIsRefreshingContext] = useState(false);
  const [showContextDebug, setShowContextDebug] = useState(false);
  const [contextPack, setContextPack] = useState<WorkspaceContextPack | null>(null);
  const [generateType, setGenerateType] = useState<'image' | 'video' | 'animation'>('image');
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeImages, setIncludeImages] = useState(true);
  const { config: persistedChoiceConfig, updateConfig: persistChoiceConfig } = useChoiceConfig();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const nodeTypes = useMemo(
    () => ({
      'canvas-card': CanvasCardNode,
    }),
    [],
  );

  const closePanel = () => {
    setActivePanel(null);
    setActionError(null);
  };
  const handlePaneClick = useCallback(() => setActivePanel(null), []);

  const brainstormActions = [
    { label: 'Add note', icon: Plus, onClick: actions.addQuickNote, primary: true },
    { label: 'Own content', icon: Paperclip, onClick: () => setActivePanel('upload') },
    { label: 'Generate', icon: Sparkles, onClick: () => setActivePanel('generate') },
    { label: 'Tavily scrape', icon: Globe, onClick: () => setActivePanel('scrape') },
    { label: 'Templates', icon: Library, onClick: () => setActivePanel('template') },
  ];

  const choiceActions = [
    { label: 'AI Assistant', icon: Sparkles, onClick: () => console.log('AI Refine'), primary: true },
    { label: 'Saved Presets', icon: Library, onClick: () => console.log('Presets') },
  ];

  const handleUploadSubmit = async () => {
    if (!selectedFiles.length) {
      return;
    }

    setIsUploading(true);
    setActionError(null);

    try {
      await actions.addOwnContent(selectedFiles);
      setSelectedFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      closePanel();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateSubmit = async () => {
    if (!generatePrompt.trim()) {
      return;
    }

    setActionError(null);
    actions.addGeneratedContent({
      type: generateType,
      prompt: generatePrompt.trim(),
    });
    setGeneratePrompt('');
    closePanel();
  };

  const handleScrapeSubmit = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setActionError(null);

    try {
      await actions.addResearchPack({
        query: searchQuery.trim(),
        includeImages,
      });
      setSearchQuery('');
      setIncludeImages(true);
      closePanel();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTemplateSubmit = async (templateId: string) => {
    setIsApplyingTemplate(true);
    setActionError(null);

    try {
      await actions.addTemplate({ templateId });
      closePanel();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Template failed');
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const handleRefreshContext = useCallback(async () => {
    setIsRefreshingContext(true);
    setContextError(null);

    try {
      const response = await fetch('/api/context/pack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspaceId: 'main' }),
      });

      const json = (await response.json()) as {
        contextPack?: WorkspaceContextPack;
        extraction?: {
          reused: number;
          generated: number;
          failed: number;
        };
        error?: string;
      };

      if (!response.ok || !json.contextPack) {
        throw new Error(json.error ?? 'Failed to regenerate context');
      }

      setContextPack(json.contextPack);
    } catch (error) {
      setContextError(error instanceof Error ? error.message : 'Failed to regenerate context');
    } finally {
      setIsRefreshingContext(false);
    }
  }, []);

  const handleDownloadContext = useCallback(() => {
    if (!contextPack) {
      return;
    }

    const blob = new Blob([JSON.stringify(contextPack, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    anchor.href = url;
    anchor.download = `workspace-context-${timestamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [contextPack]);

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(240,249,255,0.95),_rgba(248,250,252,1)_45%,_rgba(255,255,255,1)_100%)] text-slate-900">
      <TopNavigation
        persistenceStatus={persistenceStatus}
        persistenceError={persistenceError}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
      />

      <main className="relative h-full overflow-hidden">
        {/* Step 1: Brainstorming (ReactFlow) */}
        <div 
          className={[
            'absolute inset-0 pt-24 transition-all duration-500 ease-in-out',
            currentStep === 1 ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
          ].join(' ')}
        >
          {isCanvasReady ? (
            <ReactFlow
              nodes={nodes}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onPaneClick={handlePaneClick}
              deleteKeyCode={['Backspace', 'Delete']}
              noWheelClassName="nowheel"
              fitView
              fitViewOptions={{ padding: 0.2 }}
              proOptions={{ hideAttribution: true }}
              className="!bg-transparent"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1.2}
                color="#cbd5e1"
              />
              <Controls
                position="top-right"
                className="!top-4 !right-4 !rounded-2xl !border !border-slate-200 !bg-white/90 !shadow-lg !backdrop-blur"
              />
              <MiniMap
                pannable
                zoomable
                nodeColor={() => '#e2e8f0'}
                className="!bottom-24 !rounded-2xl !border !border-slate-200 !bg-white/90 !shadow-lg !backdrop-blur"
              />
            </ReactFlow>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/85 px-5 py-3 text-sm font-medium text-slate-600 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                <span className="size-3 animate-pulse rounded-full bg-slate-400" />
                Loading your canvas...
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Choice */}
        <div 
          className={[
            'absolute inset-0 pt-24 transition-all duration-500 ease-in-out overflow-y-auto',
            currentStep === 2 ? 'translate-x-0 opacity-100' : (currentStep < 2 ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0'),
            currentStep !== 2 ? 'pointer-events-none' : ''
          ].join(' ')}
        >
          <ChoiceScreen
            initialConfig={persistedChoiceConfig}
            onConfigChange={persistChoiceConfig}
            onComplete={(config) => {
              persistChoiceConfig(config);
              setCurrentStep(3);
            }}
          />
        </div>

        {/* Step 3: Generating (Empty) */}
        <div 
          className={[
            'absolute inset-0 pt-24 transition-all duration-500 ease-in-out',
            currentStep === 3 ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
          ].join(' ')}
        >
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 overflow-y-auto px-6 pb-32 pt-2">
            <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl">
              <div className="flex min-h-[380px] items-center justify-center rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(248,250,252,0.98)_55%,_rgba(241,245,249,1)_100%)] px-6 py-10">
                <div className="flex max-w-xl flex-col items-center text-center">
                  <div className="mb-4 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 shadow-sm">
                    Generating
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight text-slate-950">
                    Generation output will live here
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    This page will later focus on actual image and video generation results. The internal context inspector is hidden unless you explicitly open it.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowContextDebug((current) => !current)}
                    className="mt-8 inline-flex items-center gap-3 rounded-full bg-slate-950 px-7 py-4 text-base font-medium text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.6)] transition hover:bg-slate-800"
                  >
                    {showContextDebug ? (
                      <>
                        <ChevronUp className="size-5" />
                        Hide Context Inspector
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-5" />
                        Open Context Inspector
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-slate-100 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.5)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Context Inspector
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Hidden by default. Expand only when you want to verify the internal structured context.
                  </p>
                </div>
                {showContextDebug ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadContext}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!contextPack || isRefreshingContext}
                    >
                      Download JSON
                    </button>
                    <button
                      type="button"
                      onClick={handleRefreshContext}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isRefreshingContext}
                    >
                      <RefreshCw className={['size-4', isRefreshingContext ? 'animate-spin' : ''].join(' ')} />
                      {isRefreshingContext ? 'Regenerating...' : 'Regenerate context'}
                    </button>
                  </div>
                ) : null}
              </div>

              {!showContextDebug ? (
                <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-center text-sm text-slate-400">
                  Inspector hidden. Expand it only when you want to audit the extracted context structure.
                </div>
              ) : contextPack ? (
                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Notes</p>
                      <p className="mt-3 text-3xl font-bold text-white">{contextPack.notes.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Templates</p>
                      <p className="mt-3 text-3xl font-bold text-white">{contextPack.templates.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Documents</p>
                      <p className="mt-3 text-3xl font-bold text-white">{contextPack.documents.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Media</p>
                      <p className="mt-3 text-3xl font-bold text-white">{contextPack.images.length + contextPack.videos.length}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Overview</p>
                      <p className="mt-3 text-sm leading-7 text-slate-200">{contextPack.overview.summary}</p>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Key Facts</p>
                          <ul className="mt-3 space-y-2 text-sm text-slate-200">
                            {contextPack.baseContext.keyFacts.slice(0, 8).map((item) => (
                              <li key={item} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Style Signals</p>
                          <ul className="mt-3 space-y-2 text-sm text-slate-200">
                            {contextPack.baseContext.styleSignals.slice(0, 8).map((item) => (
                              <li key={item} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Generation Intent</p>
                      <div className="mt-4 space-y-3 text-sm text-slate-200">
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><span className="text-slate-400">Platforms:</span> {contextPack.generationIntent.platforms.join(', ') || 'None'}</div>
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><span className="text-slate-400">Requested types:</span> {contextPack.generationIntent.requestedContentTypes.join(', ') || 'None'}</div>
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><span className="text-slate-400">Selected templates:</span> {contextPack.generationIntent.selectedTemplates.join(', ') || 'None'}</div>
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><span className="text-slate-400">Audiences:</span> {contextPack.generationIntent.audiences.join(', ') || 'None'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="grid gap-4">
                      <pre className="max-h-[12vh] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-slate-200">{JSON.stringify({ overview: contextPack.overview }, null, 2)}</pre>
                      <pre className="max-h-[12vh] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-slate-200">{JSON.stringify({ notes: contextPack.notes }, null, 2)}</pre>
                      <pre className="max-h-[12vh] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-slate-200">{JSON.stringify({ templates: contextPack.templates }, null, 2)}</pre>
                      <pre className="max-h-[12vh] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-slate-200">{JSON.stringify({ documents: contextPack.documents }, null, 2)}</pre>
                      <pre className="max-h-[12vh] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-slate-200">{JSON.stringify({ images: contextPack.images, videos: contextPack.videos }, null, 2)}</pre>
                      <pre className="max-h-[12vh] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-slate-200">{JSON.stringify({ generatedContent: contextPack.generatedContent }, null, 2)}</pre>
                    </div>
                    <div className="grid gap-4">
                      <pre className="max-h-[18vh] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-slate-200">{JSON.stringify({ baseContext: contextPack.baseContext }, null, 2)}</pre>
                      <pre className="max-h-[18vh] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-slate-200">{JSON.stringify({ generationIntent: contextPack.generationIntent }, null, 2)}</pre>
                      <pre className="max-h-[24vh] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-slate-200">
                        {JSON.stringify(
                          contextPack.sourceArtifacts.map((artifact) => ({
                            sourceNodeId: artifact.sourceNodeId,
                            sourceType: artifact.sourceType,
                            title: artifact.title,
                            summary: artifact.summary,
                          })),
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-center text-sm text-slate-400">
                  {contextError ? (
                    <span className="text-red-300">{contextError}</span>
                  ) : (
                    'Open the inspector and regenerate the context when you want to verify the latest extracted structure.'
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {activePanel === 'upload' ? (
        <WorkspaceActionPanel
          title="Upload From Your Machine"
          description="Choose images, videos, or documents. Each file will appear as its own asset on the canvas."
          onClose={closePanel}
        >
          <div className="flex flex-col gap-4">
            {actionError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {actionError}
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
              onChange={(event) =>
                setSelectedFiles(Array.from(event.target.files ?? []))
              }
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
            />
            {selectedFiles.length ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-sm font-medium text-slate-900">
                  Files ready for the canvas
                </p>
                <div className="flex flex-col gap-2">
                  {selectedFiles.map((file) => (
                    <div
                      key={`${file.name}-${file.lastModified}`}
                      className="truncate rounded-2xl bg-white px-3 py-2 text-sm text-slate-600"
                      title={file.name}
                    >
                      {trimLabel(file.name)}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUploadSubmit}
                className="rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!selectedFiles.length || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Add to canvas'}
              </button>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </WorkspaceActionPanel>
      ) : null}

      {activePanel === 'generate' ? (
        <WorkspaceActionPanel
          title="Generate Content"
          description="Choose a generator, describe the asset, and a node will appear immediately while it renders on the canvas."
          onClose={closePanel}
        >
          <div className="flex flex-col gap-4">
            {actionError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {actionError}
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Generator</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setGenerateType('image')}
                  className={[
                    'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition',
                    generateType === 'image'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                  ].join(' ')}
                >
                  <ImageIcon className="size-4" />
                  Nano Banana
                </button>
                <button
                  type="button"
                  onClick={() => setGenerateType('video')}
                  className={[
                    'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition',
                    generateType === 'video'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                  ].join(' ')}
                >
                  <Video className="size-4" />
                  Veo
                </button>
                <button
                  type="button"
                  onClick={() => setGenerateType('animation')}
                  className={[
                    'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition',
                    generateType === 'animation'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                  ].join(' ')}
                >
                  <Sparkles className="size-4" />
                  Hera
                </button>
              </div>
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Prompt</span>
              <textarea
                value={generatePrompt}
                onChange={(event) => setGeneratePrompt(event.target.value)}
                placeholder="A premium hero visual for a smart bottle on a marble desk at sunrise..."
                className="min-h-28 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGenerateSubmit}
                className="rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!generatePrompt.trim()}
              >
                Add to canvas
              </button>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </WorkspaceActionPanel>
      ) : null}

      {activePanel === 'scrape' ? (
        <WorkspaceActionPanel
          title="Scrape With Tavily"
          description="Enter what you want to research. The board will add a search result note and optionally an image stack."
          onClose={closePanel}
        >
          <div className="flex flex-col gap-4">
            {actionError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {actionError}
              </div>
            ) : null}
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">What should Tavily look for?</span>
              <textarea
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Best landing pages for wellness product launches"
                className="min-h-24 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={includeImages}
                onChange={(event) => setIncludeImages(event.target.checked)}
                className="size-4 rounded border-slate-300"
              />
              Include images and add them as a stack on the canvas
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleScrapeSubmit}
                className="rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!searchQuery.trim() || isSearching}
              >
                {isSearching ? 'Searching...' : 'Add Tavily output'}
              </button>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </WorkspaceActionPanel>
      ) : null}

      {activePanel === 'template' ? (
        <WorkspaceActionPanel
          title="Templates"
          description="Click a template to add it to your board."
          onClose={closePanel}
        >
          <TemplateGallery
            templates={contentTemplates}
            onSelect={handleTemplateSubmit}
            isApplying={isApplyingTemplate}
          />
        </WorkspaceActionPanel>
      ) : null}

      {currentStep !== 3 ? (
        <FloatingToolbar
          currentStep={currentStep}
          actions={currentStep === 1 ? brainstormActions : choiceActions}
        />
      ) : null}
    </div>
  );
}
