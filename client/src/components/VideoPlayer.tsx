import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
}

export function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const isVideo = videoUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          <CardTitle className="text-lg">Original Video</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
          {isVideo ? (
            <video
              controls
              className="w-full h-full"
              data-testid="video-player"
            >
              <source src={videoUrl} type="video/mp4" />
              <source src={videoUrl} type="video/webm" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <audio
              controls
              className="w-full"
              data-testid="audio-player-fallback"
            >
              <source src={videoUrl} />
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
