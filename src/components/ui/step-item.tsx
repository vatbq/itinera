import { WorkflowStep } from "@/types/workflow";
import { StepIcon } from "./step-icon";

const STEP_LABELS: Record<string, string> = {
  INIT: "Initializing",
  EXTRACT_FILES: "Extracting PDF files",
  PROCESS_DOCUMENTS: "Processing documents",
  MERGING: "Merging trip details",
  BUILD: "Building itinerary",
  VALIDATE: "Validating itinerary",
  BUILD_MARKDOWN: "Generating final output",
};


export function StepItem({ step }: { step: WorkflowStep }) {
  const label = STEP_LABELS[step.name] || step.name;
  
  return (
    <div className="flex items-start gap-3">
      <StepIcon status={step.status} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </p>
        {step.message && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {step.message}
          </p>
        )}
      </div>
    </div>
  );
}