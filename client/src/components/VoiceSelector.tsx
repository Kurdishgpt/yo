import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic2, Download, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface VoiceSelectorProps {
  translatedText: string;
}

const voiceOptions = [
  { value: "1_speaker", label: "Male 1" },
  { value: "2_speaker", label: "Male 2" },
  { value: "3_speaker", label: "Female 1" },
  { value: "4_speaker", label: "Female 2" },
];

export function VoiceSelector({ translatedText }: VoiceSelectorProps) {
  const [selectedVoice, setSelectedVoice] = useState("1_speaker");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [generatedAudioUrl]);

  const handleGenerateVoice = async () => {
    if (!translatedText) {
      toast({
        title: "No text available",
        description: "Please translate text first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await axios.post(
        "/api/kurdish-tts",
        {
          text: translatedText,
          speaker: selectedVoice,
        },
        {
          responseType: "blob",
        }
      );

      const blob = response.data;
      const url = URL.createObjectURL(blob);
      
      if (generatedAudioUrl) {
        URL.revokeObjectURL(generatedAudioUrl);
      }
      
      setGeneratedAudioUrl(url);
      setIsPlaying(false);
      setCurrentTime(0);

      toast({
        title: "Voice generated!",
        description: "Your Kurdish voice is ready to play.",
      });
    } catch (error: any) {
      console.error("Voice generation error:", error);
      
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || "Failed to generate voice"
        : "An unexpected error occurred";

      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Playback failed:", error);
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleDownload = () => {
    if (generatedAudioUrl) {
      const a = document.createElement("a");
      a.href = generatedAudioUrl;
      a.download = `kurdish-voice-${selectedVoice}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mic2 className="w-5 h-5" />
          <CardTitle className="text-lg">Kurdish Voice Generator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">
              Select Voice
            </label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger data-testid="select-voice">
                <SelectValue placeholder="Choose a voice" />
              </SelectTrigger>
              <SelectContent>
                {voiceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleGenerateVoice}
              disabled={isGenerating}
              className="w-full sm:w-auto"
              data-testid="button-generate-voice"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Mic2 className="w-4 h-4 mr-2" />
                  Generate Voice
                </>
              )}
            </Button>
          </div>
        </div>

        {generatedAudioUrl && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={togglePlay}
                data-testid="button-play-pause"
              >
                {isPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </Button>

              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                  data-testid="slider-seek"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                data-testid="button-download-voice"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>

            <audio
              ref={audioRef}
              src={generatedAudioUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
