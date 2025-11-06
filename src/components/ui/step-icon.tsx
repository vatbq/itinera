import { WorkflowStep } from "@/types/workflow";

export function StepIcon({ status }: { status: WorkflowStep["status"] }) {
  if (status === "running") {
    return (
      <div className="flex-shrink-0 mt-0.5">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="flex-shrink-0 mt-0.5">
        <svg
          className="h-5 w-5 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex-shrink-0 mt-0.5">
        <svg
          className="h-5 w-5 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
    );
  }

  // pending
  return (
    <div className="flex-shrink-0 mt-0.5">
      <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-700" />
    </div>
  );
}
