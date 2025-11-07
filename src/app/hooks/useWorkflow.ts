import { WorkflowRun, WorkflowUpdate } from "@/types/workflow";
import { useEffect, useState } from "react";

interface UseWorkflowProps {
  runId: string;
  onComplete?: (markdown: string) => void;
}

export const useWorkflow = ({ runId, onComplete }: UseWorkflowProps) => {
  const [workflow, setWorkflow] = useState<WorkflowRun>(() => ({
    id: runId,
    steps: [],
    status: "pending",
    createdAt: Date.now(),
  }));

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workflow.status === "completed" && workflow.markdown && onComplete) {
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

  return { workflow, error };
};
