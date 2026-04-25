'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Film, FolderOpen, ImageIcon, Sparkles, Video } from 'lucide-react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
} from 'reactflow';

import { useCanvasBoard } from '../../hooks/useCanvasBoard';
import { FloatingToolbar } from './FloatingToolbar';
import { TopNavigation } from './TopNavigation';
import { WorkspaceActionPanel } from './WorkspaceActionPanel';
import { TemplateGallery } from './TemplateGallery';
import { CanvasCardNode } from './nodes/CanvasCardNode';
import {
  contentTemplates,
  TEMPLATE_ASSET_DIRECTORIES,
} from '../../lib/templates/catalog';

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
  const [generateType, setGenerateType] = useState<'image' | 'video' | 'animation'>('image');
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeImages, setIncludeImages] = useState(true);
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

  const handleTemplateSync = async () => {
    setIsApplyingTemplate(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Syncing templates from Supabase...');
    } finally {
      setIsApplyingTemplate(false);
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

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(240,249,255,0.95),_rgba(248,250,252,1)_45%,_rgba(255,255,255,1)_100%)] text-slate-900">
      <TopNavigation
        persistenceStatus={persistenceStatus}
        persistenceError={persistenceError}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
      />

      <main className="h-full pt-24">
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

      <FloatingToolbar
        onAddNote={actions.addQuickNote}
        onOpenUpload={() => setActivePanel('upload')}
        onOpenGenerate={() => setActivePanel('generate')}
        onOpenScrape={() => setActivePanel('scrape')}
        onOpenTemplate={() => setActivePanel('template')}
      />
    </div>
  );
}
