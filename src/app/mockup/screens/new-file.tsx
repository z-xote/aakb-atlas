"use client";

import {
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from "react";
import {
  BathIcon,
  BoxIcon,
  CameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CookingPotIcon,
  LayersIcon,
  WashingMachineIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  budgetRangeLabels,
  budgetRanges,
  jobTypeLabels,
  jobTypes,
  projectTypeLabels,
  projectTypes,
  relationshipStatusLabels,
  relationshipStatuses,
  workflowStageLabels,
  workflowStages,
  type BudgetRange,
  type JobType,
  type ProjectType,
  type RelationshipStatus,
  type WorkflowStage,
} from "@/types/atlas";
import type { MockupScreen } from "../types";
import { MockTopbar } from "../mock-ui";

const projectTypeIcons: Record<ProjectType, LucideIcon> = {
  kitchen: CookingPotIcon,
  bathroom: BathIcon,
  laundry: WashingMachineIcon,
  materials: LayersIcon,
  other: BoxIcon,
};

/* ------------------------------------------------------------------ */
/* Shared field styling (matches the rest of the mockup)              */
/* ------------------------------------------------------------------ */

const fieldBase = "w-full border px-3 text-sm outline-none transition-colors";
const fieldStyle: CSSProperties = {
  borderColor: "var(--atlas-border-strong)",
  borderRadius: "var(--atlas-radius)",
  background: "var(--atlas-bg-muted)",
  color: "var(--atlas-text-primary)",
};

function focusAccent(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  event.currentTarget.style.borderColor = "var(--atlas-accent)";
}
function blurAccent(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  event.currentTarget.style.borderColor = "var(--atlas-border-strong)";
}

function Labeled({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="atlas-label">
          {label}
        </label>
      ) : (
        <span className="atlas-label">{label}</span>
      )}
      {children}
      {hint ? (
        <p className="text-xs" style={{ color: "var(--atlas-text-tertiary)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Tappable pill group — the wizard's stand-in for the form's native selects. */
function OptionPills<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className="inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-bold transition-colors"
            style={{
              borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border)",
              background: active ? "var(--atlas-accent-soft)" : "var(--atlas-bg-surface)",
              color: active ? "var(--atlas-accent)" : "var(--atlas-text-secondary)",
            }}
          >
            {labels[option]}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Wizard steps                                                       */
/* ------------------------------------------------------------------ */

const wizardSteps = [
  {
    id: "basics",
    label: "Basics",
    heading: "Start the file",
    blurb: "Just enough to start shooting — everything else can wait.",
  },
  {
    id: "scope",
    label: "Scope",
    heading: "Scope & budget",
    blurb: "A rough sense of the job so Atlas can frame it.",
  },
  {
    id: "pipeline",
    label: "Pipeline",
    heading: "Where it sits",
    blurb: "Where this file sits in your pipeline right now.",
  },
  {
    id: "contact",
    label: "Contact",
    heading: "Primary contact",
    blurb: "One obvious contact for this file.",
  },
] as const;

function NewFileScreen() {
  const [step, setStep] = useState(0);

  // Same field set as the full FileForm — grouped across the four steps.
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  const [jobType, setJobType] = useState<JobType>("renovation");
  const [budgetRange, setBudgetRange] = useState<BudgetRange>("unknown");
  const [leadSource, setLeadSource] = useState("");
  const [relationshipStatus, setRelationshipStatus] =
    useState<RelationshipStatus>("prospect");
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>("new_file");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [note, setNote] = useState("");

  const current = wizardSteps[step];
  const isLast = step === wizardSteps.length - 1;
  const canCreate =
    title.trim().length > 0 &&
    projectType !== null &&
    contactName.trim().length > 0;

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{ background: "var(--atlas-bg-root)", color: "var(--atlas-text-primary)" }}
    >
      <MockTopbar breadcrumb={["Files", "New file"]} />

      <main className="atlas-frame flex flex-1 flex-col justify-center py-10">
        <div className="mx-auto w-full max-w-2xl">
          {/* Stepper */}
          <ol className="mb-6 flex items-center">
            {wizardSteps.map((wizardStep, index) => {
              const done = index < step;
              const isCurrent = index === step;
              return (
                <li
                  key={wizardStep.id}
                  className={cn(
                    "flex items-center",
                    index < wizardSteps.length - 1 && "flex-1"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setStep(index)}
                    className="flex items-center gap-2.5 text-left"
                  >
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors"
                      style={{
                        borderColor:
                          done || isCurrent
                            ? "var(--atlas-accent)"
                            : "var(--atlas-border-strong)",
                        background: done
                          ? "var(--atlas-accent)"
                          : isCurrent
                            ? "var(--atlas-accent-soft)"
                            : "var(--atlas-bg-surface)",
                        color: done
                          ? "#fff"
                          : isCurrent
                            ? "var(--atlas-accent)"
                            : "var(--atlas-text-tertiary)",
                      }}
                    >
                      {done ? <CheckIcon className="size-4" /> : index + 1}
                    </span>
                    <span
                      className="hidden text-xs font-bold sm:block"
                      style={{
                        color: isCurrent
                          ? "var(--atlas-text-primary)"
                          : "var(--atlas-text-tertiary)",
                      }}
                    >
                      {wizardStep.label}
                    </span>
                  </button>
                  {index < wizardSteps.length - 1 ? (
                    <span
                      className="mx-3 h-px flex-1"
                      style={{
                        background: done
                          ? "var(--atlas-accent)"
                          : "var(--atlas-border)",
                      }}
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>

          <section className="atlas-simple-panel">
            <div className="atlas-simple-panel-head">
              <div className="flex min-w-0 flex-col">
                <h2>{current.heading}</h2>
                <p className="mt-0.5 text-sm" style={{ color: "var(--atlas-text-secondary)" }}>
                  {current.blurb}
                </p>
              </div>
              <span
                className="shrink-0 text-xs font-bold"
                style={{ color: "var(--atlas-text-tertiary)" }}
              >
                Step {step + 1} of {wizardSteps.length}
              </span>
            </div>

            <div className="atlas-simple-panel-body grid gap-6">
              {/* Step 1 — Basics */}
              {step === 0 ? (
                <>
                  <Labeled label="File name" htmlFor="title">
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Hartley — Main Bathroom"
                      className={cn(fieldBase, "h-11")}
                      style={fieldStyle}
                      onFocus={focusAccent}
                      onBlur={blurAccent}
                    />
                  </Labeled>

                  <Labeled label="Project type">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {projectTypes.map((type) => {
                        const Icon = projectTypeIcons[type];
                        const active = projectType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setProjectType(type)}
                            className={cn(
                              "atlas-image-tab min-h-24 flex-col items-start justify-between gap-3",
                              active && "atlas-active"
                            )}
                          >
                            <span className="flex w-full items-center justify-between">
                              <Icon />
                              {active ? <CheckIcon className="size-4" /> : null}
                            </span>
                            <strong>{projectTypeLabels[type]}</strong>
                          </button>
                        );
                      })}
                    </div>
                  </Labeled>
                </>
              ) : null}

              {/* Step 2 — Scope & budget */}
              {step === 1 ? (
                <>
                  <Labeled label="Job type">
                    <OptionPills
                      options={jobTypes}
                      labels={jobTypeLabels}
                      value={jobType}
                      onChange={setJobType}
                    />
                  </Labeled>

                  <Labeled label="Budget range">
                    <OptionPills
                      options={budgetRanges}
                      labels={budgetRangeLabels}
                      value={budgetRange}
                      onChange={setBudgetRange}
                    />
                  </Labeled>

                  <Labeled
                    label="Lead source"
                    htmlFor="leadSource"
                    hint="Where this file came from — referral, Instagram, repeat client."
                  >
                    <input
                      id="leadSource"
                      type="text"
                      value={leadSource}
                      onChange={(event) => setLeadSource(event.target.value)}
                      placeholder="Referral — Priya"
                      className={cn(fieldBase, "h-11")}
                      style={fieldStyle}
                      onFocus={focusAccent}
                      onBlur={blurAccent}
                    />
                  </Labeled>
                </>
              ) : null}

              {/* Step 3 — Pipeline */}
              {step === 2 ? (
                <>
                  <Labeled label="Relationship status">
                    <OptionPills
                      options={relationshipStatuses}
                      labels={relationshipStatusLabels}
                      value={relationshipStatus}
                      onChange={setRelationshipStatus}
                    />
                  </Labeled>

                  <Labeled label="Workflow stage" hint="Status and stage stay separate.">
                    <OptionPills
                      options={workflowStages}
                      labels={workflowStageLabels}
                      value={workflowStage}
                      onChange={setWorkflowStage}
                    />
                  </Labeled>
                </>
              ) : null}

              {/* Step 4 — Primary contact */}
              {step === 3 ? (
                <>
                  <Labeled label="Contact name" htmlFor="contactName">
                    <input
                      id="contactName"
                      type="text"
                      value={contactName}
                      onChange={(event) => setContactName(event.target.value)}
                      placeholder="Sam Hartley"
                      className={cn(fieldBase, "h-11")}
                      style={fieldStyle}
                      onFocus={focusAccent}
                      onBlur={blurAccent}
                    />
                  </Labeled>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <Labeled label="Email" htmlFor="contactEmail">
                      <input
                        id="contactEmail"
                        type="email"
                        value={contactEmail}
                        onChange={(event) => setContactEmail(event.target.value)}
                        placeholder="sam@example.com"
                        className={cn(fieldBase, "h-11")}
                        style={fieldStyle}
                        onFocus={focusAccent}
                        onBlur={blurAccent}
                      />
                    </Labeled>

                    <Labeled label="Phone" htmlFor="contactPhone">
                      <input
                        id="contactPhone"
                        type="text"
                        value={contactPhone}
                        onChange={(event) => setContactPhone(event.target.value)}
                        placeholder="+61 4xx xxx xxx"
                        className={cn(fieldBase, "h-11")}
                        style={fieldStyle}
                        onFocus={focusAccent}
                        onBlur={blurAccent}
                      />
                    </Labeled>
                  </div>

                  <Labeled label="New note" htmlFor="note">
                    <textarea
                      id="note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Site visit, rough ask, next action."
                      className={cn(fieldBase, "min-h-24 resize-y py-2")}
                      style={fieldStyle}
                      onFocus={focusAccent}
                      onBlur={blurAccent}
                    />
                  </Labeled>
                </>
              ) : null}
            </div>
          </section>

          {/* Contextual caption + secondary action */}
          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            <p className="text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>
              {isLast
                ? "Direction, rooms and labels are optional and editable later."
                : "Jump between steps anytime — nothing saves until you create the file."}
            </p>
            {isLast ? (
              <button
                type="button"
                disabled={!canCreate}
                className="text-sm font-bold underline-offset-4 transition-colors hover:underline"
                style={{
                  color: canCreate ? "var(--atlas-accent)" : "var(--atlas-text-tertiary)",
                  opacity: canCreate ? 1 : 0.6,
                  cursor: canCreate ? "pointer" : "not-allowed",
                }}
              >
                Create only, without a photo
              </button>
            ) : null}
          </div>
        </div>
      </main>

      {/* Sticky bottom nav — Back / Next split full width, aligned to the topbar */}
      <footer
        className="sticky bottom-0 z-30 border-t"
        style={{
          borderColor: "var(--atlas-border)",
          background: "color-mix(in srgb, var(--atlas-bg-surface) 92%, transparent)",
          backdropFilter: "blur(14px)",
          paddingTop: "10px",
          paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
          paddingInline:
            "max(var(--atlas-frame-inset), calc((100vw - var(--atlas-frame-max)) / 2))",
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0}
            className="atlas-btn atlas-btn-outline h-12 w-full"
            style={step === 0 ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
          >
            <ChevronLeftIcon />
            Back
          </button>

          {isLast ? (
            <button
              type="button"
              disabled={!canCreate}
              className="atlas-btn atlas-btn-primary h-12 w-full"
              style={canCreate ? undefined : { opacity: 0.45, cursor: "not-allowed" }}
            >
              <CameraIcon />
              Create &amp; take first photo
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setStep((value) => Math.min(wizardSteps.length - 1, value + 1))
              }
              className="atlas-btn atlas-btn-primary h-12 w-full"
            >
              Next
              <ChevronRightIcon />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export const screen: MockupScreen = {
  id: "new-file",
  title: "New file wizard",
  description:
    "v0.2 guided file creation — a four-step wizard (basics, scope, pipeline, contact) covering the same fields as the full form.",
  viewport: "desktop",
  Component: NewFileScreen,
};
