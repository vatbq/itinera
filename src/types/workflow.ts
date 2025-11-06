import { z } from "zod";

export const WorkflowStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
]);

export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

export const WorkflowStepSchema = z.object({
  name: z.string(),
  status: WorkflowStatusSchema,
  message: z.string().optional(),
  timestamp: z.number(),
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

export const WorkflowRunSchema = z.object({
  id: z.string(),
  status: WorkflowStatusSchema,
  steps: z.array(WorkflowStepSchema).default([]),
  warnings: z.array(z.string()).optional(),
  error: z.string().optional(),
  createdAt: z.number(),
  completedAt: z.number().optional(),
  markdown: z.string().optional(),
});

export type WorkflowRun = z.infer<typeof WorkflowRunSchema>;

export interface ProgressUpdate {
  type: "progress";
  step: WorkflowStep;
}

export interface CompletionUpdate {
  type: "completion";
  warnings: string[];
  markdown: string;
}

export type WorkflowUpdate = ProgressUpdate | CompletionUpdate;