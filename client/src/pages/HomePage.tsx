import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { ResultCard } from "@/components/ResultCard";
import { AudioPlayer } from "@/components/AudioPlayer";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { FileText, Languages, AudioWaveform, Mic2, UserRound, User } from "lucide-react";
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
  const [selectedVoice, setSelectedVoice] = useState("sorani_85");
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
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <Logo />
        </div>
      </header>
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />
        <div className="relative py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Kurdish Dubbing & Translation
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-3 max-w-2xl mx-auto">
                Upload your video or audio, get Kurdish dubbing with synchronized subtitles
              </p>
              <p className="text-sm text-muted-foreground">
                Powered by Whisper AI, Google Translate & Kurdish TTS
              </p>
            </div>

            {!isProcessing && !result && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-card rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mic2 className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Select Kurdish Voice</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant={selectedVoice === "sorani_85" ? "default" : "outline"}
                      onClick={() => setSelectedVoice("sorani_85")}
                      data-testid="button-voice-male"
                      size="lg"
                      className="h-auto py-6 px-6 justify-start gap-4 text-left transition-all duration-200 hover:scale-[1.02]"
                    >
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedVoice === "sorani_85" ? "bg-primary-foreground/20" : "bg-muted"
                        }`}
                        data-testid="icon-voice-male"
                      >
                        <UserRound className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base" data-testid="text-voice-male-title">Male Voice</div>
                        <div 
                          className={`text-sm ${
                            selectedVoice === "sorani_85" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                          data-testid="text-voice-male-language"
                        >
                          Sorani Kurdish
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant={selectedVoice === "sorani_214" ? "default" : "outline"}
                      onClick={() => setSelectedVoice("sorani_214")}
                      data-testid="button-voice-female"
                      size="lg"
                      className="h-auto py-6 px-6 justify-start gap-4 text-left transition-all duration-200 hover:scale-[1.02]"
                    >
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedVoice === "sorani_214" ? "bg-primary-foreground/20" : "bg-muted"
                        }`}
                        data-testid="icon-voice-female"
                      >
                        <User className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base" data-testid="text-voice-female-title">Female Voice</div>
                        <div 
                          className={`text-sm ${
                            selectedVoice === "sorani_214" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                          data-testid="text-voice-female-language"
                        >
                          Sorani Kurdish
                        </div>
                      </div>
                    </Button>
                  </div>
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
            <div className="space-y-8 transition-all duration-700 opacity-100">
              {result.originalMedia && (
                <div className="transition-all duration-500 opacity-100">
                  <VideoPlayer videoUrl={result.originalMedia} />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="transition-all duration-500 opacity-100">
                  <ResultCard
                    title="Original Transcription"
                    content={result.transcription}
                    icon={<FileText className="w-5 h-5" />}
                    language="EN"
                  />
                </div>
                <div className="transition-all duration-500 opacity-100">
                  <ResultCard
                    title="Kurdish Translation"
                    content={result.translated}
                    icon={<Languages className="w-5 h-5" />}
                    language="CKB"
                  />
                </div>
                <div className="transition-all duration-500 opacity-100">
                  <ResultCard
                    title="Generated Subtitles"
                    content={result.srt}
                    icon={<AudioWaveform className="w-5 h-5" />}
                    isMonospace
                    onDownload={() => downloadFile(result.srt, "subtitles.srt")}
                  />
                </div>
              </div>

              <div className="transition-all duration-500 opacity-100">
                <AudioPlayer audioUrl={result.tts} onDownload={downloadAudio} />
              </div>

              <div className="flex justify-center transition-all duration-500 opacity-100">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStartNew}
                  data-testid="button-start-new"
                  className="hover:scale-105 transition-transform"
                >
                  Start New Translation
                </Button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      <footer className="border-t bg-muted/30 py-12 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Languages className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-lg">Kurdish Dubbing</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Professional Kurdish translation and dubbing powered by AI
            </p>
            <p className="text-xs text-muted-foreground">
              &copy; 2025 Kurdish Dubbing Application • Powered by Whisper AI, Google Translate & Kurdish TTS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
