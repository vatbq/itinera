import { WorkflowRun, WorkflowStep, WorkflowStatus } from "@/types/workflow";

/**
 * In-Memory Workflow Progress Tracking
 */
const runs = new Map<string, WorkflowRun>();

export function newRun(): string {
  // use math.random to generate a random UUID
  const runId = Math.random().toString(36).substring(2, 15);

  const run: WorkflowRun = {
    id: runId,
    status: "pending",
    steps: [],
    createdAt: Date.now(),
  };

  runs.set(runId, run);
  return runId;
}

export function getRun(runId: string): WorkflowRun | undefined {
  return runs.get(runId);
}

export function updateRunStatus(runId: string, status: WorkflowStatus): void {
  const run = runs.get(runId);
  if (run) {
    run.status = status;
    if (status === "completed" || status === "failed") {
      run.completedAt = Date.now();
    }
  }
}

export function recordProgress(runId: string, step: WorkflowStep): void {
  const run = runs.get(runId);

  if (!run) return;

  const existingStepIndex = run.steps.findIndex((s) => s.name === step.name);

  const workflowStep: WorkflowStep = {
    name: step.name,
    status: step.status,
    message: step.message,
    timestamp: Date.now(),
  };

  if (existingStepIndex >= 0) {
    run.steps[existingStepIndex] = workflowStep;
  } else {
    run.steps.push(workflowStep);
  }

  if (step.status === "running" && run.status === "pending") {
    run.status = "running";
  }
}

export function completeRun(
  runId: string,
  result: {
    warnings: string[];
    markdown: string;
  },
): void {
  const run = runs.get(runId);

  if (!run) return;

  run.status = "completed";
  run.warnings = result.warnings;
  run.completedAt = Date.now();
}

export function failRun(runId: string, error: { message: string }): void {
  const run = runs.get(runId);
  if (!run) return;

  run.status = "failed";
  run.error = error.message;
  run.completedAt = Date.now();
}

export function getAllRuns(): WorkflowRun[] {
  return Array.from(runs.values());
}

export function clearAllRuns(): void {
  runs.clear();
}
