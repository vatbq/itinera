import { openai } from "@ai-sdk/openai";
import { LanguageModel } from "ai";

const AI_MODEL_CLASSIFY = process.env.AI_MODEL_CLASSIFY || "gpt-4o-mini";
const AI_MODEL_EXTRACT = process.env.AI_MODEL_EXTRACT || "gpt-4o-mini";

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "OPENAI_API_KEY is not defined. AI classification and extraction will fail.",
  );
}

export function getModel(name?: string): LanguageModel {
  const modelName = name || AI_MODEL_CLASSIFY;
  return openai(modelName);
}

export function getClassifyModel(): LanguageModel {
  return openai(AI_MODEL_CLASSIFY);
}

export function getExtractModel(): LanguageModel {
  return openai(AI_MODEL_EXTRACT);
}
