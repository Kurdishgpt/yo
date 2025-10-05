import { AudioPlayer } from '../AudioPlayer';

export default function AudioPlayerExample() {
  return (
    <div className="p-8">
      <AudioPlayer
        audioUrl="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        onDownload={() => console.log('Download audio')}
      />
    </div>
  );
}
