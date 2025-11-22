import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudioMixerProps {
  dubbingTrack: string;
  backgroundTrack: string;
  englishVoiceTrack: string;
  timestamp?: number;
}

export function AudioMixer({
  dubbingTrack,
  backgroundTrack,
  englishVoiceTrack,
  timestamp = Date.now(),
}: AudioMixerProps) {
  const [dubbingVolume, setDubbingVolume] = useState(100);
  const [backgroundVolume, setBackgroundVolume] = useState(60);
  const [englishVoiceVolume, setEnglishVoiceVolume] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<"mixed" | "dubbing" | "background" | "english" | null>(null);
  const audioRefs = {
    mixed: useRef<HTMLAudioElement>(null),
    dubbing: useRef<HTMLAudioElement>(null),
    background: useRef<HTMLAudioElement>(null),
    english: useRef<HTMLAudioElement>(null),
  };

  const { toast } = useToast();

  const stopAllTracks = () => {
    Object.values(audioRefs).forEach((ref) => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
  };

  const playTrack = (track: "mixed" | "dubbing" | "background" | "english") => {
    stopAllTracks();
    if (activeTrack === track && isPlaying) {
      audioRefs[track].current?.pause();
      setIsPlaying(false);
      setActiveTrack(null);
    } else {
      audioRefs[track].current?.play();
      setIsPlaying(true);
      setActiveTrack(track);
    }
  };

  const downloadMix = async () => {
    try {
      // Create a temporary canvas to use Web Audio API for mixing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const [dubbingBuffer, backgroundBuffer, englishBuffer] = await Promise.all([
        fetch(dubbingTrack).then(r => r.arrayBuffer()).then(ab => audioContext.decodeAudioData(ab)),
        fetch(backgroundTrack).then(r => r.arrayBuffer()).then(ab => audioContext.decodeAudioData(ab)),
        fetch(englishVoiceTrack).then(r => r.arrayBuffer()).then(ab => audioContext.decodeAudioData(ab)),
      ]);

      const maxLength = Math.max(
        dubbingBuffer.length,
        backgroundBuffer.length,
        englishBuffer.length
      );

      const mixedBuffer = audioContext.createBuffer(
        2,
        maxLength,
        audioContext.sampleRate
      );

      const left = mixedBuffer.getChannelData(0);
      const right = mixedBuffer.getChannelData(1);

      // Mix channels
      const dubbingLeft = dubbingBuffer.getChannelData(0);
      const backgroundLeft = backgroundBuffer.getChannelData(0);
      const englishLeft = englishBuffer.getChannelData(0);

      const dubbingGain = dubbingVolume / 100;
      const backgroundGain = backgroundVolume / 100;
      const englishGain = englishVoiceVolume / 100;

      for (let i = 0; i < maxLength; i++) {
        left[i] = (
          (dubbingLeft[i] || 0) * dubbingGain +
          (backgroundLeft[i] || 0) * backgroundGain +
          (englishLeft[i] || 0) * englishGain
        );
        right[i] = left[i];
      }

      // Download the mixed audio
      const link = document.createElement("a");
      const blob = new Blob([left], { type: "audio/wav" });
      link.href = URL.createObjectURL(blob);
      link.download = `kurdish-dubbed-mix-${timestamp}.wav`;
      link.click();

      toast({
        title: "Download started",
        description: "Your mixed audio is being downloaded",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate mixed audio",
        duration: 3000,
      });
      console.error("Mix generation error:", error);
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Audio Mixer</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Adjust individual track volumes
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dubbing Voice Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              Dubbing Voice (Kurdish)
            </label>
            <span className="text-sm font-semibold text-blue-600">{dubbingVolume}%</span>
          </div>
          <Slider
            value={[dubbingVolume]}
            onValueChange={(val) => setDubbingVolume(val[0])}
            min={0}
            max={100}
            step={1}
            data-testid="slider-dubbing-volume"
            className="w-full"
          />
        </div>

        {/* Background Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Background (Music & Effects)
            </label>
            <span className="text-sm font-semibold text-green-600">{backgroundVolume}%</span>
          </div>
          <Slider
            value={[backgroundVolume]}
            onValueChange={(val) => setBackgroundVolume(val[0])}
            min={0}
            max={100}
            step={1}
            data-testid="slider-background-volume"
            className="w-full"
          />
        </div>

        {/* English Voice Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              English Voice (Reference)
            </label>
            <span className="text-sm font-semibold text-orange-600">{englishVoiceVolume}%</span>
          </div>
          <Slider
            value={[englishVoiceVolume]}
            onValueChange={(val) => setEnglishVoiceVolume(val[0])}
            min={0}
            max={100}
            step={1}
            data-testid="slider-english-volume"
            className="w-full"
          />
        </div>

        {/* Playback Buttons */}
        <div className="pt-4 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeTrack === "dubbing" ? "default" : "outline"}
              size="sm"
              onClick={() => playTrack("dubbing")}
              data-testid="button-play-dubbing"
              className="flex-1"
            >
              {activeTrack === "dubbing" && isPlaying ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Dubbing Only
            </Button>
            <Button
              variant={activeTrack === "background" ? "default" : "outline"}
              size="sm"
              onClick={() => playTrack("background")}
              data-testid="button-play-background"
              className="flex-1"
            >
              {activeTrack === "background" && isPlaying ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Background Only
            </Button>
            <Button
              variant={activeTrack === "english" ? "default" : "outline"}
              size="sm"
              onClick={() => playTrack("english")}
              data-testid="button-play-english"
              className="flex-1"
            >
              {activeTrack === "english" && isPlaying ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              English Only
            </Button>
          </div>

          <Button
            variant="default"
            className="w-full"
            onClick={downloadMix}
            data-testid="button-download-mix"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Mixed Audio
          </Button>
        </div>

        {/* Hidden Audio Elements */}
        <audio ref={audioRefs.dubbing} src={dubbingTrack} onEnded={() => setIsPlaying(false)} />
        <audio ref={audioRefs.background} src={backgroundTrack} onEnded={() => setIsPlaying(false)} />
        <audio ref={audioRefs.english} src={englishVoiceTrack} onEnded={() => setIsPlaying(false)} />
      </CardContent>
    </Card>
  );
}
