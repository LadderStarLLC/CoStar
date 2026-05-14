"use client";

import type { ReactNode } from "react";
import { Loader2, Megaphone, Plus, RefreshCw, Save, Trash2, Upload } from "lucide-react";
import {
  defaultHomepageContent,
  type HomepageAccountCard,
  type HomepageAccountType,
  type HomepageAuthenticatedHero,
  type HomepageContent,
  type HomepageMarqueeSlide,
} from "@/lib/homepageContent";

export interface AdminHomepageConfig {
  publishedContent: HomepageContent;
  draftContent: HomepageContent;
  version: number;
  publishedAt: string | null;
  publishedBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  lastPublishReason: string | null;
}

type SiteContentEditorProps = {
  config: AdminHomepageConfig | null;
  draft: HomepageContent | null;
  publishReason: string;
  isLoading: boolean;
  isActing: boolean;
  isOwner: boolean;
  onDraftChange: (draft: HomepageContent) => void;
  onPublishReasonChange: (reason: string) => void;
  onReload: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
};

const accountTypes: HomepageAccountType[] = ["talent", "business", "agency"];

export default function SiteContentEditor({
  config,
  draft,
  publishReason,
  isLoading,
  isActing,
  isOwner,
  onDraftChange,
  onPublishReasonChange,
  onReload,
  onSaveDraft,
  onPublish,
}: SiteContentEditorProps) {
  const disabled = isActing || isLoading || !draft;

  function updateDraft(updater: (current: HomepageContent) => HomepageContent) {
    if (!draft) return;
    onDraftChange(updater(draft));
  }

  function updateCard(accountType: HomepageAccountType, updates: Partial<HomepageAccountCard>) {
    updateDraft((current) => ({
      ...current,
      cards: {
        ...current.cards,
        [accountType]: {
          ...current.cards[accountType],
          ...updates,
          primaryCta: updates.primaryCta
            ? { ...current.cards[accountType].primaryCta, ...updates.primaryCta }
            : current.cards[accountType].primaryCta,
          secondaryCta: updates.secondaryCta
            ? { ...current.cards[accountType].secondaryCta, ...updates.secondaryCta }
            : current.cards[accountType].secondaryCta,
        },
      },
    }));
  }

  function updateHero(accountType: HomepageAccountType, updates: Partial<HomepageAuthenticatedHero>) {
    updateDraft((current) => ({
      ...current,
      authenticatedHeroes: {
        ...current.authenticatedHeroes,
        [accountType]: {
          ...current.authenticatedHeroes[accountType],
          ...updates,
          cta: updates.cta
            ? { ...current.authenticatedHeroes[accountType].cta, ...updates.cta }
            : current.authenticatedHeroes[accountType].cta,
        },
      },
    }));
  }

  function updateSlide(index: number, updates: Partial<HomepageMarqueeSlide>) {
    updateDraft((current) => ({
      ...current,
      marqueeSlides: current.marqueeSlides.map((slide, slideIndex) => (
        slideIndex === index ? { ...slide, ...updates } : slide
      )),
    }));
  }

  function addSlide() {
    updateDraft((current) => ({
      ...current,
      marqueeSlides: [
        ...current.marqueeSlides,
        {
          ...defaultHomepageContent.marqueeSlides[0],
          id: `slide-${Date.now()}`,
          title: "New homepage slide",
          cta: { ...defaultHomepageContent.marqueeSlides[0].cta },
        },
      ],
    }));
  }

  function removeSlide(index: number) {
    updateDraft((current) => ({
      ...current,
      marqueeSlides: current.marqueeSlides.filter((_, slideIndex) => slideIndex !== index),
    }));
  }

  return (
    <section className="rounded-lg border border-white/10 bg-slate-800/50 p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sm text-sky-300">
            <Megaphone className="h-4 w-4" />
            Site Content
          </div>
          <h2 className="text-2xl font-bold text-white">Homepage Content</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
            Draft changes are private. Publishing updates the public homepage after owner approval.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Version {config?.version ?? 0} · Last published {formatDateTime(config?.publishedAt ?? null)}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onReload}
            disabled={isActing || isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={onPublish}
              disabled={disabled || !publishReason.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              Publish
            </button>
          )}
        </div>
      </div>

      {isOwner && (
        <label className="mb-6 block">
          <span className="mb-2 block text-sm font-semibold text-slate-300">Publish reason</span>
          <input
            value={publishReason}
            onChange={(event) => onPublishReasonChange(event.target.value)}
            placeholder="Example: Update public launch messaging"
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </label>
      )}

      {isLoading && (
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
        </div>
      )}

      {!isLoading && draft && (
        <div className="space-y-6">
          <EditorPanel title="Announcement banner">
            <BooleanField
              label="Enabled"
              checked={draft.announcement.enabled}
              onChange={(enabled) => updateDraft((current) => ({
                ...current,
                announcement: { ...current.announcement, enabled },
              }))}
            />
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)]">
              <TextField label="Text" value={draft.announcement.text} onChange={(text) => updateDraft((current) => ({ ...current, announcement: { ...current.announcement, text } }))} />
              <TextField label="CTA label" value={draft.announcement.label} onChange={(label) => updateDraft((current) => ({ ...current, announcement: { ...current.announcement, label } }))} />
              <TextField label="CTA href" value={draft.announcement.href} onChange={(href) => updateDraft((current) => ({ ...current, announcement: { ...current.announcement, href } }))} />
            </div>
          </EditorPanel>

          <EditorPanel title="Marquee slides">
            <div className="space-y-4">
              {draft.marqueeSlides.map((slide, index) => (
                <div key={slide.id || index} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="font-bold text-white">Slide {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeSlide(index)}
                      disabled={draft.marqueeSlides.length <= 1}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <TextField label="Profile type" value={slide.profileType} onChange={(profileType) => updateSlide(index, { profileType })} />
                    <TextField label="Title" value={slide.title} onChange={(title) => updateSlide(index, { title })} />
                    <TextField label="Accent hex" value={slide.accent} onChange={(accent) => updateSlide(index, { accent })} />
                    <TextField label="Image URL" value={slide.image} onChange={(image) => updateSlide(index, { image })} />
                    <TextField label="ID" value={slide.id} onChange={(id) => updateSlide(index, { id })} />
                    <TextField label="CTA label" value={slide.cta.label} onChange={(label) => updateSlide(index, { cta: { ...slide.cta, label } })} />
                    <TextField label="CTA href" value={slide.cta.href} onChange={(href) => updateSlide(index, { cta: { ...slide.cta, href } })} />
                  </div>
                  <TextAreaField label="Description" value={slide.description} onChange={(description) => updateSlide(index, { description })} />
                </div>
              ))}
              <button
                type="button"
                onClick={addSlide}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600"
              >
                <Plus className="h-4 w-4" />
                Add Slide
              </button>
            </div>
          </EditorPanel>

          <EditorPanel title="Account cards">
            <div className="grid gap-4 xl:grid-cols-3">
              {accountTypes.map((accountType) => {
                const card = draft.cards[accountType];
                return (
                  <div key={accountType} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                    <h4 className="mb-3 text-lg font-bold capitalize text-white">{accountType}</h4>
                    <div className="space-y-3">
                      <BooleanField label="Enabled" checked={card.enabled} onChange={(enabled) => updateCard(accountType, { enabled })} />
                      <TextField label="Title" value={card.title} onChange={(title) => updateCard(accountType, { title })} />
                      <TextField label="Subtitle" value={card.subtitle} onChange={(subtitle) => updateCard(accountType, { subtitle })} />
                      <TextField label="Image URL" value={card.image} onChange={(image) => updateCard(accountType, { image })} />
                      <TextAreaField label="Body" value={card.body} onChange={(body) => updateCard(accountType, { body })} />
                      <TextField label="Primary CTA label" value={card.primaryCta.label} onChange={(label) => updateCard(accountType, { primaryCta: { ...card.primaryCta, label } })} />
                      <TextField label="Primary CTA href" value={card.primaryCta.href} onChange={(href) => updateCard(accountType, { primaryCta: { ...card.primaryCta, href } })} />
                      <TextField label="Secondary CTA label" value={card.secondaryCta.label} onChange={(label) => updateCard(accountType, { secondaryCta: { ...card.secondaryCta, label } })} />
                      <TextField label="Secondary CTA href" value={card.secondaryCta.href} onChange={(href) => updateCard(accountType, { secondaryCta: { ...card.secondaryCta, href } })} />
                    </div>
                  </div>
                );
              })}
            </div>
          </EditorPanel>

          <EditorPanel title="Logged-in heroes">
            <div className="grid gap-4 xl:grid-cols-3">
              {accountTypes.map((accountType) => {
                const hero = draft.authenticatedHeroes[accountType];
                return (
                  <div key={accountType} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                    <h4 className="mb-3 text-lg font-bold capitalize text-white">{accountType}</h4>
                    <div className="space-y-3">
                      <TextField label="Greeting" value={hero.greeting} onChange={(greeting) => updateHero(accountType, { greeting })} />
                      <TextField label="Headline" value={hero.headline} onChange={(headline) => updateHero(accountType, { headline })} />
                      <TextField label="Background image URL" value={hero.bgImage} onChange={(bgImage) => updateHero(accountType, { bgImage })} />
                      <TextAreaField label="Subcopy" value={hero.sub} onChange={(sub) => updateHero(accountType, { sub })} />
                      <TextField label="CTA label" value={hero.cta.label} onChange={(label) => updateHero(accountType, { cta: { ...hero.cta, label } })} />
                      <TextField label="CTA href" value={hero.cta.href} onChange={(href) => updateHero(accountType, { cta: { ...hero.cta, href } })} />
                    </div>
                  </div>
                );
              })}
            </div>
          </EditorPanel>

          <EditorPanel title="Featured jobs">
            <BooleanField
              label="Enabled"
              checked={draft.featuredJobs.enabled}
              onChange={(enabled) => updateDraft((current) => ({ ...current, featuredJobs: { ...current.featuredJobs, enabled } }))}
            />
            <div className="grid gap-3 lg:grid-cols-2">
              <TextField label="Eyebrow" value={draft.featuredJobs.eyebrow} onChange={(eyebrow) => updateDraft((current) => ({ ...current, featuredJobs: { ...current.featuredJobs, eyebrow } }))} />
              <TextField label="Headline" value={draft.featuredJobs.headline} onChange={(headline) => updateDraft((current) => ({ ...current, featuredJobs: { ...current.featuredJobs, headline } }))} />
              <TextField label="CTA label" value={draft.featuredJobs.cta.label} onChange={(label) => updateDraft((current) => ({ ...current, featuredJobs: { ...current.featuredJobs, cta: { ...current.featuredJobs.cta, label } } }))} />
              <TextField label="CTA href" value={draft.featuredJobs.cta.href} onChange={(href) => updateDraft((current) => ({ ...current, featuredJobs: { ...current.featuredJobs, cta: { ...current.featuredJobs.cta, href } } }))} />
              <TextField label="Background image URL" value={draft.featuredJobs.backgroundImage} onChange={(backgroundImage) => updateDraft((current) => ({ ...current, featuredJobs: { ...current.featuredJobs, backgroundImage } }))} />
              <TextField label="Search query" value={draft.featuredJobs.searchQuery} onChange={(searchQuery) => updateDraft((current) => ({ ...current, featuredJobs: { ...current.featuredJobs, searchQuery } }))} />
              <TextField label="Search display text" value={draft.featuredJobs.searchDisplayText} onChange={(searchDisplayText) => updateDraft((current) => ({ ...current, featuredJobs: { ...current.featuredJobs, searchDisplayText } }))} />
              <TextField label="Button label" value={draft.featuredJobs.buttonLabel} onChange={(buttonLabel) => updateDraft((current) => ({ ...current, featuredJobs: { ...current.featuredJobs, buttonLabel } }))} />
            </div>
            <TextAreaField label="Body" value={draft.featuredJobs.body} onChange={(body) => updateDraft((current) => ({ ...current, featuredJobs: { ...current.featuredJobs, body } }))} />
          </EditorPanel>
        </div>
      )}
    </section>
  );
}

function EditorPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
      <h3 className="mb-4 text-xl font-bold text-white">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function BooleanField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-400">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full resize-y rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
      />
    </label>
  );
}

function formatDateTime(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
