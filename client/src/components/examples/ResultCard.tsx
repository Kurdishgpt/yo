import { ResultCard } from '../ResultCard';
import { FileText } from 'lucide-react';

export default function ResultCardExample() {
  return (
    <div className="p-8 grid gap-6">
      <ResultCard
        title="Original Transcription"
        content="This is a sample transcription of the original audio content. It contains the text that was extracted from the audio file using speech recognition technology."
        icon={<FileText className="w-5 h-5" />}
        language="EN"
      />
      <ResultCard
        title="Kurdish Translation"
        content="ئەمە نموونەیەکی وەرگێڕانی کوردییە بۆ ناوەڕۆکی دەنگی سەرەتایی. ئەم دەقە دەتوانرێت بەکاربهێنرێت بۆ دروستکردنی دەنگی کوردی."
        language="CKB"
      />
      <ResultCard
        title="Generated Subtitles"
        content={`1
00:00:00,000 --> 00:00:03,500
This is the first subtitle line

2
00:00:03,500 --> 00:00:07,000
This is the second subtitle line`}
        isMonospace
        onDownload={() => console.log('Download SRT')}
      />
    </div>
  );
}
