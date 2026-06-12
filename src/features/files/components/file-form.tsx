import Link from "next/link";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/types/atlas";
import type { FileDetail } from "@/features/files/data";

type FileFormProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
  detail?: FileDetail;
};

export function FileForm({
  action,
  submitLabel,
  cancelHref,
  detail,
}: FileFormProps) {
  const file = detail?.file;
  const contact = detail?.contact;

  return (
    <form action={action} className="flex flex-col gap-5">
      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <FieldGroup className="rounded-lg border bg-card p-4">
          <div>
            <h2 className="text-base font-medium">File</h2>
            <p className="text-sm text-muted-foreground">
              One renovation opportunity. One place for notes, assets, and runs.
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="title">File name</FieldLabel>
            <Input
              id="title"
              name="title"
              defaultValue={file?.title ?? ""}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="relationshipStatus">Relationship status</FieldLabel>
              <NativeSelect
                id="relationshipStatus"
                name="relationshipStatus"
                className="w-full"
                defaultValue={file?.relationshipStatus ?? "prospect"}
              >
                {relationshipStatuses.map((status) => (
                  <NativeSelectOption key={status} value={status}>
                    {relationshipStatusLabels[status]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            <Field>
              <FieldLabel htmlFor="workflowStage">Workflow stage</FieldLabel>
              <NativeSelect
                id="workflowStage"
                name="workflowStage"
                className="w-full"
                defaultValue={file?.workflowStage ?? "new_file"}
              >
                {workflowStages.map((stage) => (
                  <NativeSelectOption key={stage} value={stage}>
                    {workflowStageLabels[stage]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>Status and stage stay separate.</FieldDescription>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="projectType">Project type</FieldLabel>
              <NativeSelect
                id="projectType"
                name="projectType"
                className="w-full"
                defaultValue={file?.projectType ?? "kitchen"}
              >
                {projectTypes.map((projectType) => (
                  <NativeSelectOption key={projectType} value={projectType}>
                    {projectTypeLabels[projectType]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            <Field>
              <FieldLabel htmlFor="budgetRange">Budget range</FieldLabel>
              <NativeSelect
                id="budgetRange"
                name="budgetRange"
                className="w-full"
                defaultValue={file?.budgetRange ?? "unknown"}
              >
                {budgetRanges.map((budgetRange) => (
                  <NativeSelectOption key={budgetRange} value={budgetRange}>
                    {budgetRangeLabels[budgetRange]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            <Field>
              <FieldLabel htmlFor="jobType">Job type</FieldLabel>
              <NativeSelect
                id="jobType"
                name="jobType"
                className="w-full"
                defaultValue={file?.jobType ?? "renovation"}
              >
                {jobTypes.map((jobType) => (
                  <NativeSelectOption key={jobType} value={jobType}>
                    {jobTypeLabels[jobType]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="leadSource">Lead source</FieldLabel>
            <Input
              id="leadSource"
              name="leadSource"
              defaultValue={file?.leadSource ?? ""}
            />
          </Field>
        </FieldGroup>

        <FieldGroup className="rounded-lg border bg-card p-4">
          <div>
            <h2 className="text-base font-medium">Primary contact</h2>
            <p className="text-sm text-muted-foreground">
              One obvious contact for this rough model.
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="contactName">Name</FieldLabel>
            <Input
              id="contactName"
              name="contactName"
              defaultValue={contact?.name ?? ""}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="contactEmail">Email</FieldLabel>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={contact?.email ?? ""}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="contactPhone">Phone</FieldLabel>
            <Input
              id="contactPhone"
              name="contactPhone"
              defaultValue={contact?.phone ?? ""}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="note">New note</FieldLabel>
            <Textarea
              id="note"
              name="note"
              defaultValue=""
              placeholder="Site visit, rough ask, next action."
            />
          </Field>
        </FieldGroup>
      </section>

      <footer className="atlas-bottom-nav atlas-form-bottom-nav">
        <div className="atlas-bottom-nav-inner">
          <Link
            href={cancelHref}
            className="atlas-bottom-nav-item atlas-form-action-cancel"
          >
            Cancel
          </Link>
          <button
            className="atlas-bottom-nav-item atlas-form-action-submit"
            type="submit"
          >
            {submitLabel}
          </button>
        </div>
      </footer>
    </form>
  );
}
