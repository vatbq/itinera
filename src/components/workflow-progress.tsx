"use client";

import { useEffect, useState } from "react";
import { WorkflowRun, WorkflowUpdate } from "@/types/workflow";
import { StatusBadge } from "./ui/status-badge";
import { StepItem } from "./ui/step-item";

interface WorkflowProgressProps {
  runId: string;
  onComplete?: (markdown: string) => void;
}

export function WorkflowProgress({ runId, onComplete }: WorkflowProgressProps) {
  const [workflow, setWorkflow] = useState<WorkflowRun>(() => ({
    id: runId,
    steps: [],
    status: "pending",
    createdAt: Date.now(),
  }));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      workflow.status === "completed" &&
      workflow.markdown &&
      onComplete
    ) {
      onComplete(workflow.markdown);
    }
  }, [workflow.status, workflow.markdown, onComplete]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/workflows/${runId}`);

    eventSource.onmessage = (event: MessageEvent<string>) => {
      try {
        const update = JSON.parse(event.data) as WorkflowUpdate;

        setWorkflow((prev) => {
          if (update.type === "progress") {
            const step = update.step;
            const existingIndex = prev.steps.findIndex(
              (s) => s.name === step.name,
            );

            const newSteps = [...prev.steps];
            if (existingIndex >= 0) {
              newSteps[existingIndex] = step;
            } else {
              newSteps.push(step);
            }

            const newStatus =
              step.status === "running" && prev.status === "pending"
                ? "running"
                : prev.status;

            return {
              ...prev,
              steps: newSteps,
              status: newStatus,
            };
          } else if (update.type === "completion") {
            return {
              ...prev,
              status: "completed",
              warnings: update.warnings,
              markdown: update.markdown,
              completedAt: Date.now(),
            };
          }

          return prev;
        });
      } catch (err) {
        console.error("Error parsing SSE data:", err);
        setError("Failed to parse workflow update");
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);

      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("SSE connection closed");
      } else {
        setError("Connection error occurred");
        eventSource.close();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [runId]);

  if (error && !workflow) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6">
        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading workflow status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Creating Your Itinerary
        </h3>
        <StatusBadge status={workflow.status} />
      </div>

      <div className="space-y-3">
        {workflow.steps.map((step) => (
          <StepItem key={step.name} step={step} />
        ))}
      </div>

      {workflow.status === "failed" && workflow.error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            {workflow.error}
          </p>
        </div>
      )}

      {workflow.status === "completed" &&
        workflow.warnings &&
        workflow.warnings.length > 0 && (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/30 p-4 space-y-2">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Warnings:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {workflow.warnings.map((warning, index) => (
                <li
                  key={index}
                  className="text-sm text-yellow-700 dark:text-yellow-300"
                >
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

      {workflow.completedAt && (
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
          Completed in{" "}
          {((workflow.completedAt - workflow.createdAt) / 1000).toFixed(1)}s
        </p>
      )}

      {error && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}

