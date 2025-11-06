import { Mistral } from "@mistralai/mistralai";

if (!process.env.MISTRAL_API_KEY) {
  throw new Error(
    "MISTRAL_API_KEY is not defined. Please add it to your .env.local file",
  );
}

export const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});
