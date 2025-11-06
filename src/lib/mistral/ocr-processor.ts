import { mistral } from "@/lib/mistral/provider";

export const extractDataFromPDF = async (pdf: File): Promise<string> => {
  const base64Data = await convertFileToBase64(pdf);
  const ocrResponse = await mistral.ocr.process({
    model: "mistral-ocr-latest",
    document: {
      type: "document_url",
      documentUrl: "data:application/pdf;base64," + base64Data,
    },
  });

  const extractedText =
    ocrResponse.pages
      ?.map((page) => page.markdown)
      .filter(Boolean)
      .join("\n\n") || "";

  return extractedText;
};

const convertFileToBase64 = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return buffer.toString("base64");
};
