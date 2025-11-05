import { PDFUploadSection } from "@/components/pdf-upload-section";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 sm:mb-12 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
              Itinera
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
              Upload your PDF documents
            </p>
          </div>

          <PDFUploadSection />
        </div>
      </div>
    </main>
  );
}
