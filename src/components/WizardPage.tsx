"use client";

import { useState } from "react";
import { Image } from "@/components/Image";
import { ChevronRight, Play, Sparkles } from "@/components/icons";
import { AppHeader } from "@/components/SiteNav";
import { TypeAvatar } from "@/components/TypeAvatar";
import { TypeBadge, TypeIcon } from "@/components/TypeBadge";
import { useLeisureItems } from "@/hooks/useLeisureItems";
import {
  pickWizardSuggestion,
  type WizardAnswers,
  type WizardEnergy,
  type WizardMood,
  type WizardTime,
} from "@/lib/suggestions";
import { LEISURE_TYPES, type LeisureItem, type LeisureType } from "@/lib/types";

const STEPS = ["time", "mood", "energy", "types"] as const;

const TIME_OPTIONS: { value: WizardTime; label: string; hint: string }[] = [
  { value: "short", label: "Under 1 hour", hint: "Quick session" },
  { value: "medium", label: "1–3 hours", hint: "Evening activity" },
  { value: "long", label: "Long session", hint: "Deep dive" },
  { value: "any", label: "No limit", hint: "Whatever fits" },
];

const MOOD_OPTIONS: { value: WizardMood; label: string }[] = [
  { value: "relax", label: "Relax & unwind" },
  { value: "excited", label: "Excited & fun" },
  { value: "learn", label: "Learn something" },
  { value: "social", label: "Social / out" },
  { value: "any", label: "Surprise me" },
];

const ENERGY_OPTIONS: { value: WizardEnergy; label: string }[] = [
  { value: "low", label: "Low energy" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High energy" },
  { value: "any", label: "Any" },
];

function SuggestionCard({ item, onStart }: { item: LeisureItem; onStart: () => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
      {item.imageUrl ? (
        <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="80px"
            unoptimized
          />
        </div>
      ) : (
        <TypeAvatar type={item.type} className="h-28 w-20 shrink-0" iconClassName="h-9 w-9" />
      )}
      <div className="min-w-0 flex-1">
        <TypeBadge type={item.type} />
        <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
        {item.subtitle && <p className="text-sm text-muted">{item.subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onStart}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20"
      >
        <Play className="h-4 w-4" />
        Start this
      </button>
    </div>
  );
}

export function WizardPage() {
  const { items, setStatus } = useLeisureItems();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({
    time: "any",
    mood: "any",
    energy: "any",
    types: [],
  });
  const [suggestion, setSuggestion] = useState<LeisureItem | null>(null);

  const step = STEPS[stepIndex];

  const next = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    setSuggestion(pickWizardSuggestion(items, answers));
  };

  const toggleType = (type: LeisureType) => {
    setAnswers((a) => ({
      ...a,
      types: a.types.includes(type) ? a.types.filter((t) => t !== type) : [...a.types, type],
    }));
  };

  const reset = () => {
    setStepIndex(0);
    setSuggestion(null);
    setAnswers({ time: "any", mood: "any", energy: "any", types: [] });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <header>
        <AppHeader />
        <div className="mt-6 flex items-center gap-2 text-accent">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Suggestion wizard</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">What fits right now?</h1>
        <p className="mt-1 text-muted">
          Answer a few questions and we&apos;ll pick from your list.
        </p>
      </header>

      {!suggestion ? (
        <section className="rounded-3xl border border-border bg-surface p-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
            Step {stepIndex + 1} of {STEPS.length}
          </p>

          {step === "time" && (
            <>
              <h2 className="text-xl font-semibold">How much time do you have?</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, time: opt.value }))}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      answers.time === opt.value
                        ? "border-accent bg-accent/10"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-xs text-muted">{opt.hint}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "mood" && (
            <>
              <h2 className="text-xl font-semibold">What mood are you in?</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {MOOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, mood: opt.value }))}
                    className={`rounded-xl border px-4 py-3 text-left font-medium transition-colors ${
                      answers.mood === opt.value
                        ? "border-accent bg-accent/10"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "energy" && (
            <>
              <h2 className="text-xl font-semibold">Energy level?</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {ENERGY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, energy: opt.value }))}
                    className={`rounded-xl border px-4 py-3 text-left font-medium transition-colors ${
                      answers.energy === opt.value
                        ? "border-accent bg-accent/10"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "types" && (
            <>
              <h2 className="text-xl font-semibold">Any format preference?</h2>
              <p className="mt-1 text-sm text-muted">Optional — leave empty for all types.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {LEISURE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleType(t.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                      answers.types.includes(t.value)
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted/60 text-muted hover:text-foreground"
                    }`}
                  >
                    <TypeIcon type={t.value} className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted hover:text-foreground disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:brightness-110"
            >
              {stepIndex === STEPS.length - 1 ? "Get suggestion" : "Next"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          {suggestion ? (
            <SuggestionCard item={suggestion} onStart={() => setStatus(suggestion.id, "active")} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center">
              <p className="text-muted">No matching items in your list.</p>
              <p className="mt-1 text-sm text-muted">Try Explore or add more items first.</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSuggestion(pickWizardSuggestion(items, answers))}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40"
            >
              Try another
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
            >
              Start over
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
