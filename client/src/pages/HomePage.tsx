import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { ResultCard } from "@/components/ResultCard";
import { AudioPlayer } from "@/components/AudioPlayer";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Languages, AudioWaveform, Mic2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

type ProcessingStep = {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed";
};

type ResultData = {
  transcription: string;
  translated: string;
  srt: string;
  tts: string;
  originalMedia?: string;
  isVideo?: boolean;
};

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("1_speaker");
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: "1", label: "Extracting Audio", status: "pending" },
    { id: "2", label: "Transcribing", status: "pending" },
    { id: "3", label: "Translating to Kurdish Central", status: "pending" },
    { id: "4", label: "Preparing Audio", status: "pending" },
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
    formData.append("speaker", selectedVoice);

    try {
      updateStep("1", "processing");
      setProgress(10);

      const response = await axios.post<ResultData>("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: any) => {
          const uploadProgress = progressEvent.total
            ? Math.round((progressEvent.loaded * 25) / progressEvent.total)
            : 0;
          setProgress(uploadProgress);
        },
      });

      updateStep("1", "completed");
      updateStep("2", "processing");
      setProgress(40);

      await new Promise(resolve => setTimeout(resolve, 500));
      updateStep("2", "completed");
      updateStep("3", "processing");
      setProgress(65);

      await new Promise(resolve => setTimeout(resolve, 500));
      updateStep("3", "completed");
      updateStep("4", "processing");
      setProgress(85);

      await new Promise(resolve => setTimeout(resolve, 500));
      updateStep("4", "completed");
      setProgress(100);

      setResult(response.data);
      setIsProcessing(false);

      toast({
        title: "Processing complete!",
        description: "Your Kurdish dubbing is ready.",
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
      { id: "3", label: "Translating to Kurdish", status: "pending" },
      { id: "4", label: "Generating Kurdish Audio", status: "pending" },
    ]);
    setProgress(0);
  };

  const downloadAudio = () => {
    if (result?.tts) {
      const a = document.createElement("a");
      a.href = result.tts;
      a.download = "kurdish-dubbing.mp3";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
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
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Logo />
        </div>
      </header>
      
      <div className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Kurdish Dubbing & Translation
            </h2>
            <p className="text-lg text-muted-foreground mb-2">
              Upload your video or audio, get Kurdish dubbing with synchronized subtitles
            </p>
            <p className="text-sm text-muted-foreground">
              Powered by Whisper AI, Google Translate & Kurdish TTS
            </p>
          </div>

          {!isProcessing && !result && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-card rounded-lg border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mic2 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Select Kurdish Voice</h3>
                </div>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="w-full md:w-64" data-testid="select-dubbing-voice">
                    <SelectValue placeholder="Choose a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_speaker">Kurdish Voice 1</SelectItem>
                    <SelectItem value="4_speaker">Kurdish Voice 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              {result.originalMedia && (
                <VideoPlayer videoUrl={result.originalMedia} />
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ResultCard
                  title="Original Transcription"
                  content={result.transcription}
                  icon={<FileText className="w-5 h-5" />}
                  language="EN"
                />
                <ResultCard
                  title="Kurdish Translation"
                  content={result.translated}
                  icon={<Languages className="w-5 h-5" />}
                  language="CKB"
                />
                <ResultCard
                  title="Generated Subtitles"
                  content={result.srt}
                  icon={<AudioWaveform className="w-5 h-5" />}
                  isMonospace
                  onDownload={() => downloadFile(result.srt, "subtitles.srt")}
                />
              </div>

              <AudioPlayer audioUrl={result.tts} onDownload={downloadAudio} />

              <div className="flex justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStartNew}
                  data-testid="button-start-new"
                >
                  Start New Translation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Kurdish Dubbing Application &copy; 2025 • Powered by Free AI Tools</p>
        </div>
      </footer>
    </div>
  );
}
