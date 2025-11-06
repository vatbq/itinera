"use client";

import { useParams } from "next/navigation";
import { WorkflowProgress } from "@/components/workflow-progress";
import { useState } from "react";
import Link from "next/link";

export default function WorkflowPage() {
  const params = useParams();
  const runId = params.id as string;
  const [markdown, setMarkdown] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to upload
          </Link>
        </div>

        {/* Workflow Progress */}
        <WorkflowProgress runId={runId} onComplete={(md) => setMarkdown(md)} />

        {/* Markdown Result */}
        {markdown && (
          <div className="mt-8 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Your Itinerary
              </h2>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(markdown);
                }}
                className="inline-flex items-center gap-2 rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </button>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 rounded-md p-4 overflow-x-auto">
                {markdown}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
