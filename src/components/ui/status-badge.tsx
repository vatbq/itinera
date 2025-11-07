import { WorkflowRun } from "@/types/workflow";

export function StatusBadge({ status }: { status: WorkflowRun["status"] }) {
  const styles = {
    pending: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    running: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    completed:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status === "running" && (
        <div className="h-2 w-2 animate-pulse rounded-full bg-current" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
