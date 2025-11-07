import { mistral } from "@/lib/mistral/provider";

export const extractDataFromPDF = async (content: string): Promise<string> => {
  const ocrResponse = await mistral.ocr.process({
    model: "mistral-ocr-latest",
    document: {
      type: "document_url",
      documentUrl: "data:application/pdf;base64," + content,
    },
  });

  const extractedText =
    ocrResponse.pages
      ?.map((page) => page.markdown)
      .filter(Boolean)
      .join("\n\n") || "";

  return extractedText;
};
