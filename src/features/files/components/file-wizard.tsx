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

const projectTypeIcons: Record<ProjectType, LucideIcon> = {
  kitchen: CookingPotIcon,
  bathroom: BathIcon,
  laundry: WashingMachineIcon,
  materials: LayersIcon,
  other: BoxIcon,
};

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
            aria-pressed={active}
            className="inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-bold transition-colors"
            key={option}
            onClick={() => onChange(option)}
            style={{
              borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border)",
              background: active ? "var(--atlas-accent-soft)" : "var(--atlas-bg-surface)",
              color: active ? "var(--atlas-accent)" : "var(--atlas-text-secondary)",
            }}
            type="button"
          >
            {labels[option]}
          </button>
        );
      })}
    </div>
  );
}

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

export function FileWizard({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [step, setStep] = useState(0);
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

  const formValues = {
    title,
    projectType: projectType ?? "",
    jobType,
    budgetRange,
    leadSource,
    relationshipStatus,
    workflowStage,
    contactName,
    contactEmail,
    contactPhone,
    note,
  };

  return (
    <form action={action} className="flex min-h-[calc(100vh-var(--atlas-topbar-h))] flex-1 flex-col">
      {Object.entries(formValues).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}

      <main className="atlas-frame flex flex-1 flex-col justify-center py-10">
        <div className="mx-auto w-full max-w-2xl">
          <ol className="mb-6 flex items-center" aria-label="File creation progress">
            {wizardSteps.map((wizardStep, index) => {
              const done = index < step;
              const isCurrent = index === step;
              return (
                <li
                  className={cn(
                    "flex items-center",
                    index < wizardSteps.length - 1 && "flex-1"
                  )}
                  key={wizardStep.id}
                >
                  <button
                    aria-current={isCurrent ? "step" : undefined}
                    className="flex items-center gap-2.5 text-left"
                    onClick={() => setStep(index)}
                    type="button"
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
              <span className="shrink-0 text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>
                Step {step + 1} of {wizardSteps.length}
              </span>
            </div>

            <div className="atlas-simple-panel-body grid gap-6">
              {step === 0 ? (
                <>
                  <Labeled label="File name" htmlFor="title">
                    <input
                      autoFocus
                      className={cn(fieldBase, "h-11")}
                      id="title"
                      onBlur={blurAccent}
                      onChange={(event) => setTitle(event.target.value)}
                      onFocus={focusAccent}
                      placeholder="Hartley — Main Bathroom"
                      style={fieldStyle}
                      type="text"
                      value={title}
                    />
                  </Labeled>

                  <Labeled label="Project type">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {projectTypes.map((type) => {
                        const Icon = projectTypeIcons[type];
                        const active = projectType === type;
                        return (
                          <button
                            aria-pressed={active}
                            className={cn(
                              "atlas-image-tab min-h-24 flex-col items-start justify-between gap-3",
                              active && "atlas-active"
                            )}
                            key={type}
                            onClick={() => setProjectType(type)}
                            type="button"
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

              {step === 1 ? (
                <>
                  <Labeled label="Job type">
                    <OptionPills
                      labels={jobTypeLabels}
                      onChange={setJobType}
                      options={jobTypes}
                      value={jobType}
                    />
                  </Labeled>

                  <Labeled label="Budget range">
                    <OptionPills
                      labels={budgetRangeLabels}
                      onChange={setBudgetRange}
                      options={budgetRanges}
                      value={budgetRange}
                    />
                  </Labeled>

                  <Labeled
                    label="Lead source"
                    htmlFor="leadSource"
                    hint="Where this file came from — referral, Instagram, repeat client."
                  >
                    <input
                      className={cn(fieldBase, "h-11")}
                      id="leadSource"
                      onBlur={blurAccent}
                      onChange={(event) => setLeadSource(event.target.value)}
                      onFocus={focusAccent}
                      placeholder="Referral — Priya"
                      style={fieldStyle}
                      type="text"
                      value={leadSource}
                    />
                  </Labeled>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <Labeled label="Relationship status">
                    <OptionPills
                      labels={relationshipStatusLabels}
                      onChange={setRelationshipStatus}
                      options={relationshipStatuses}
                      value={relationshipStatus}
                    />
                  </Labeled>

                  <Labeled label="Workflow stage" hint="Status and stage stay separate.">
                    <OptionPills
                      labels={workflowStageLabels}
                      onChange={setWorkflowStage}
                      options={workflowStages}
                      value={workflowStage}
                    />
                  </Labeled>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <Labeled label="Contact name" htmlFor="contactName">
                    <input
                      autoFocus
                      className={cn(fieldBase, "h-11")}
                      id="contactName"
                      onBlur={blurAccent}
                      onChange={(event) => setContactName(event.target.value)}
                      onFocus={focusAccent}
                      placeholder="Sam Hartley"
                      style={fieldStyle}
                      type="text"
                      value={contactName}
                    />
                  </Labeled>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <Labeled label="Email" htmlFor="contactEmail">
                      <input
                        className={cn(fieldBase, "h-11")}
                        id="contactEmail"
                        onBlur={blurAccent}
                        onChange={(event) => setContactEmail(event.target.value)}
                        onFocus={focusAccent}
                        placeholder="sam@example.com"
                        style={fieldStyle}
                        type="email"
                        value={contactEmail}
                      />
                    </Labeled>

                    <Labeled label="Phone" htmlFor="contactPhone">
                      <input
                        className={cn(fieldBase, "h-11")}
                        id="contactPhone"
                        onBlur={blurAccent}
                        onChange={(event) => setContactPhone(event.target.value)}
                        onFocus={focusAccent}
                        placeholder="+61 4xx xxx xxx"
                        style={fieldStyle}
                        type="text"
                        value={contactPhone}
                      />
                    </Labeled>
                  </div>

                  <Labeled label="New note" htmlFor="note">
                    <textarea
                      className={cn(fieldBase, "min-h-24 resize-y py-2")}
                      id="note"
                      onBlur={blurAccent}
                      onChange={(event) => setNote(event.target.value)}
                      onFocus={focusAccent}
                      placeholder="Site visit, rough ask, next action."
                      style={fieldStyle}
                      value={note}
                    />
                  </Labeled>
                </>
              ) : null}
            </div>
          </section>

          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            <p className="text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>
              {isLast
                ? "Direction, rooms and labels are optional and editable later."
                : "Jump between steps anytime — nothing saves until you create the file."}
            </p>
            {isLast ? (
              <button
                className="text-sm font-bold underline-offset-4 transition-colors hover:underline"
                disabled={!canCreate}
                name="completionIntent"
                style={{
                  color: canCreate ? "var(--atlas-accent)" : "var(--atlas-text-tertiary)",
                  opacity: canCreate ? 1 : 0.6,
                  cursor: canCreate ? "pointer" : "not-allowed",
                }}
                type="submit"
                value="create"
              >
                Create only, without a photo
              </button>
            ) : null}
          </div>
        </div>
      </main>

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
            className="atlas-btn atlas-btn-outline h-12 w-full"
            disabled={step === 0}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            style={step === 0 ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
            type="button"
          >
            <ChevronLeftIcon />
            Back
          </button>

          {isLast ? (
            <button
              className="atlas-btn atlas-btn-primary h-12 w-full"
              disabled={!canCreate}
              name="completionIntent"
              style={canCreate ? undefined : { opacity: 0.45, cursor: "not-allowed" }}
              type="submit"
              value="capture"
            >
              <CameraIcon />
              Create &amp; take first photo
            </button>
          ) : (
            <button
              className="atlas-btn atlas-btn-primary h-12 w-full"
              onClick={() => setStep((value) => Math.min(wizardSteps.length - 1, value + 1))}
              type="button"
            >
              Next
              <ChevronRightIcon />
            </button>
          )}
        </div>
      </footer>
    </form>
  );
}
