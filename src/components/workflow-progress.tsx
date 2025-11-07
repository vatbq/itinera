"use client";

import { StatusBadge } from "./ui/status-badge";
import { StepItem } from "./ui/step-item";
import { useWorkflow } from "@/app/hooks/useWorkflow";

interface WorkflowProgressProps {
  runId: string;
  onComplete?: (markdown: string) => void;
}

export function WorkflowProgress({ runId, onComplete }: WorkflowProgressProps) {
  const { workflow, error, isConnecting } = useWorkflow({ runId, onComplete });

  if (error && !workflow) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-950/30 p-6">
        <p className="text-sm text-red-200">{error}</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="rounded-lg border border-gray-800 bg-black/50 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-700 border-t-blue-400" />
          <p className="text-sm text-gray-400">
            Loading workflow status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-black/50 backdrop-blur-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-100">
            Creating Your Itinerary
          </h3>
          {isConnecting && (
            <span className="text-xs text-gray-500">(connecting...)</span>
          )}
        </div>
        <StatusBadge status={workflow.status} />
      </div>

      <div className="space-y-3">
        {workflow.steps.map((step) => (
          <StepItem key={step.name} step={step} />
        ))}
      </div>

      {workflow.status === "failed" && workflow.error && (
        <div className="rounded-md bg-red-950/30 border border-red-800/50 p-4">
          <p className="text-sm text-red-200">
            {workflow.error}
          </p>
        </div>
      )}

      {workflow.status === "completed" &&
        workflow.warnings &&
        workflow.warnings.length > 0 && (
          <div className="rounded-md bg-yellow-950/30 border border-yellow-800/50 p-4 space-y-2">
            <p className="text-sm font-medium text-yellow-200">
              Warnings:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {workflow.warnings.map((warning, index) => (
                <li
                  key={index}
                  className="text-sm text-yellow-300"
                >
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

      {workflow.completedAt && (
        <p className="text-xs text-gray-500 text-center">
          Completed in{" "}
          {((workflow.completedAt - workflow.createdAt) / 1000).toFixed(1)}s
        </p>
      )}

      {error && (
        <p className="text-xs text-yellow-400 text-center">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
