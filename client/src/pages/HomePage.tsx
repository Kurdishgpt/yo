import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { ResultCard } from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { FileText, AudioWaveform } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

type ProcessingStep = {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed";
};

type ResultData = {
  transcription: string;
  srt: string;
};

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: "1", label: "Extracting Audio", status: "pending" },
    { id: "2", label: "Transcribing", status: "pending" },
  ]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ResultData | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setResult(null);
    
    const formData = new FormData();
    formData.append("media", file);

    try {
      updateStep("1", "processing");
      setProgress(10);

      const response = await axios.post<ResultData>("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: any) => {
          const uploadProgress = progressEvent.total
            ? Math.round((progressEvent.loaded * 50) / progressEvent.total)
            : 0;
          setProgress(uploadProgress);
        },
      });

      updateStep("1", "completed");
      updateStep("2", "processing");
      setProgress(75);

      await new Promise(resolve => setTimeout(resolve, 500));
      updateStep("2", "completed");
      setProgress(100);

      setResult(response.data);
      setIsProcessing(false);

      toast({
        title: "Processing complete!",
        description: "Your transcription is ready.",
      });
    } catch (error: any) {
      console.error("Processing error:", error);
      setIsProcessing(false);
      
      const errorMessage = axios.isAxiosError(error) 
        ? error.response?.data?.error || error.message
        : "An unexpected error occurred";

      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive",
      });

      setSteps(prev =>
        prev.map(step =>
          step.status === "processing" ? { ...step, status: "pending" } : step
        )
      );
    }
  };

  const updateStep = (id: string, status: ProcessingStep["status"]) => {
    setSteps(prev =>
      prev.map(step => (step.id === id ? { ...step, status } : step))
    );
  };

  const handleStartNew = () => {
    setSelectedFile(null);
    setResult(null);
    setSteps([
      { id: "1", label: "Extracting Audio", status: "pending" },
      { id: "2", label: "Transcribing", status: "pending" },
    ]);
    setProgress(0);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Audio & Video Transcription
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              Upload your video or audio, get accurate transcription with synchronized subtitles
            </p>
            <p className="text-sm text-muted-foreground">
              Powered by Local Whisper AI
            </p>
          </div>

          {!isProcessing && !result && (
            <div className="max-w-4xl mx-auto">
              <FileUpload onFileSelect={handleFileSelect} />
            </div>
          )}

          {isProcessing && (
            <div className="max-w-4xl mx-auto">
              <ProcessingStatus steps={steps} currentProgress={progress} />
            </div>
          )}

          {result && !isProcessing && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResultCard
                  title="Transcription"
                  content={result.transcription}
                  icon={<FileText className="w-5 h-5" />}
                />
                <ResultCard
                  title="Generated Subtitles (SRT)"
                  content={result.srt}
                  icon={<AudioWaveform className="w-5 h-5" />}
                  isMonospace
                  onDownload={() => downloadFile(result.srt, "subtitles.srt")}
                />
              </div>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStartNew}
                  data-testid="button-start-new"
                >
                  Start New Transcription
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Transcription Application &copy; 2025 • Powered by Local Whisper AI</p>
        </div>
      </footer>
    </div>
  );
}
